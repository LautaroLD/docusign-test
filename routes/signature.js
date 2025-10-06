const express = require('express');
const router = express.Router();
const { getDocuSignClient, getEnvelopesApi, getEnvelopesStatus, getEnvelopeDocuments } = require('../lib/docusign');

router.post('/send', async (req, res) => {
  try {
    const {
      signerEmail,
      signerName,
      documentBase64,
    } = req.body;

    if (!signerEmail || !signerName || !documentBase64) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // iniciar el cliente y la api del sobre
    const client = await getDocuSignClient();
    const envelopesApi = getEnvelopesApi(client);

    const document = {
      documentBase64,
      name: "contrato-de-crédito",
      fileExtension: 'pdf',
      documentId: '2',
    };

    const signHereTab = {
      anchorString: '/sn1/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      recipientId: '1',
      tabLabel: 'Firma aquí',
    };
    const nameSignerTab = {
      anchorString: '/name1/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      recipientId: '1',
      tabLabel: 'Nombre completo',
    };

    const dateSignedTab = {
      anchorString: '/date1/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      recipientId: '1',
      tabLabel: 'Fecha',
    };

    const tabs = {
      signHereTabs: [signHereTab],
      dateSignedTabs: [dateSignedTab],
      fullNameTabs: [nameSignerTab],
    };

    const signer = {
      email: signerEmail,
      name: signerName,
      recipientId: '1',
      routingOrder: '1',
      clientUserId: '1',
      tabs,
    };

    const recipients = { signers: [signer] };

    const envelopeDefinition = {
      emailSubject: 'Por favor firma el contrato para continuar con el proceso',
      emailBlurb: 'Firma el documento adjunto',
      documents: [document],
      recipients,
      status: 'sent',
    };
    // crea y envia el sobre
    const results = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      { envelopeDefinition }
    );
    // obtiene la url para firmar
    const signUrl = await envelopesApi.createRecipientView(
      process.env.DOCUSIGN_ACCOUNT_ID,
      results.envelopeId,
      {
        recipientViewRequest: {
          returnUrl: "http://localhost:3001?envelopeId=" + results.envelopeId,
          authenticationMethod: "none",
          email: signerEmail,
          userName: signerName,
          clientUserId: signer.clientUserId,
        }
      }
    );

    return res.json({
      signUrl: signUrl.url,
      success: true,
      envelopeId: results.envelopeId,
      status: results.status,
      message: 'Documento enviado para firma exitosamente',
    });
  } catch (error) {
    console.error('Error al enviar documento:', error);
    return res.status(500).json({
      error: 'Error al enviar documento',
      details: error.message,
    });
  }
});
router.get('/status/:envelopeId', async (req, res) => {
  const envelopeId = req.params.envelopeId;
  try {
    // iniciar el cliente y obtiene la data del sobre (con el status)
    const client = await getDocuSignClient();

    const envelope = await getEnvelopesStatus(client, envelopeId);
    return res.json({
      status: envelope.status,
    });
  } catch (error) {
    console.error('Error al obtener el estado del documento:', error);
    return res.status(500).json({
      error: 'Error al obtener el estado del documento',
      details: error.message,
    });
  }
});
router.get('/documents/:envelopeId', async (req, res) => {
  const envelopeId = req.params.envelopeId;
  try {
    // iniciar el cliente, obtiene el documento del sobre y lo envía para descargar
    const client = await getDocuSignClient();
    const doc = await getEnvelopeDocuments(client, envelopeId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=documento.pdf");
    res.send(Buffer.from(doc, "binary"));


  } catch (error) {
    console.error('Error al obtener el estado del documento:', error);
    return res.status(500).json({
      error: 'Error al obtener el estado del documento',
      details: error.message,
    });
  }
});
module.exports = router;