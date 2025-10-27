const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getDocuSignClient, getEnvelopesApi, getEnvelopesStatus, getEnvelopeDocuments } = require('../../lib/docusign');

router.post('/send', async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      countryCode,
      cuit_cuil,
      amount,
      quotes,
    } = req.body;

    if (!email || !name || !phone || !countryCode) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // iniciar el cliente y la api del sobre
    const client = await getDocuSignClient();
    const envelopesApi = getEnvelopesApi(client);
    // Ruta al archivo PDF
    const filePath = path.join(process.cwd(), "files", "documento.pdf");

    // Leer el archivo como buffer
    const pdfBuffer = fs.readFileSync(filePath);

    // Convertir a Base64
    const pdfBase64 = pdfBuffer.toString("base64");

    const document = {
      documentBase64: pdfBase64,
      name: "contrato-de-crédito",
      fileExtension: 'pdf',
      documentId: '1',
    };

    const signHereTabClient = {
      anchorString: '/sign-client/', // texto de anclaje en el documento, puede ser cualquier texto que este en el documento, debe ser único
      anchorUnits: 'pixels',
      anchorXOffset: '0', // desplazamiento en x desde el anclaje
      anchorYOffset: '0', // desplazamiento en y desde el anclaje
      documentId: '1',
      pageNumber: '1',
      tabLabel: 'Firma aquí',
    };
    const nameSignerTabClient = {
      anchorString: '/name-client/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      locked: true,
      tabLabel: 'Nombre completo',
    };

    const dateSignedTabClient = {
      anchorString: '/date-client/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      tabLabel: 'Fecha',
    };
    const cuitSignedTabClient = {
      anchorString: '/cuit-client/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      tabLabel: 'CUIT',
      value: cuit_cuil, // reemplazar por el valor real de la pyme
      locked: true, // no permite editar el campo
    };
    const amountTabClient = {
      anchorString: '/amount-client/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      tabLabel: 'Monto',
      value: Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount), // reemplazar por el valor real del monto
      locked: true, // no permite editar el campo
    };
    const quotesTabClient = {
      anchorString: '/quotes-client/',
      anchorUnits: 'pixels',
      anchorXOffset: '0',
      anchorYOffset: '0',
      documentId: '1',
      pageNumber: '1',
      tabLabel: 'Cuotas',
      value: quotes, // reemplazar por el valor real de las cuotas
      locked: true, // no permite editar el campo
    };
    // agrega las tabs al firmante
    // para agregar mas tabs, primero definir el objeto y luego agregarlo al array correspondiente
    // textTabs es para campos de texto (que no son firma, nombre o fecha)
    // fullNameTabs es para el nombre completo
    // dateSignedTabs es para la fecha
    // signHereTabs es para la firma

    const tabsClient = {
      fullNameTabs: [nameSignerTabClient],
      dateSignedTabs: [dateSignedTabClient],
      signHereTabs: [signHereTabClient],
      textTabs: [cuitSignedTabClient, amountTabClient, quotesTabClient],
    };

    const signClient = {
      email: email,
      name: name,
      recipientId: '1',
      // clientUserId: '1', // necesario para identificar que es un firmante embebido para envelopesApi.createRecipientView y devolver la url del documento. cuando se indica este campo, no se envia el email al firmante
      identityVerification: {
        workflowId: process.env.DOCUSIGN_IDENTITY_WORKFLOW_ID,
        inputOptions: [
          {
            name: "phone_number_list",
            valueType: "PhoneNumberList",
            phoneNumberList: [
              { countryCode: countryCode, number: phone }
            ]
          }
        ]
      },
      tabs: tabsClient,
    };
    const recipients = { signers: [signClient] };

    const envelopeDefinition = {
      emailSubject: 'Por favor firma el contrato para continuar con el proceso',
      emailBlurb: 'Firma el documento adjunto',
      documents: [document],
      recipients,
      status: 'sent',
    };
    // crea el sobre 
    const results = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      { envelopeDefinition }
    );

    // obtiene la url para firmar
    // const signUrl = await envelopesApi.createRecipientView(
    //   process.env.DOCUSIGN_ACCOUNT_ID,
    //   results.envelopeId,
    //   {
    //     recipientViewRequest: {
    //       returnUrl: "http://localhost:3001?envelopeId=" + results.envelopeId,
    //       authenticationMethod: "none",
    //       email: email,
    //       userName: name,
    //       clientUserId: signClient.clientUserId,
    //     }
    //   }
    // );

    return res.json({
      // signUrl: signUrl.url, // url para redirigir al firmante
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