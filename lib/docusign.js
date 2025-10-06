const docusign = require('docusign-esign');

const apiClient = new docusign.ApiClient();
apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH);

async function getDocuSignClient() {
  // inicia el cliente
  const rsaKey = process.env.DOCUSIGN_PRIVATE_KEY;

  const results = await apiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    ['signature', 'impersonation'],
    rsaKey,
    3600
  );
  // agrega el token al header
  apiClient.addDefaultHeader(
    'Authorization',
    `Bearer ${results.body.access_token}`
  );

  return apiClient;
}

function getEnvelopesApi(client) {
  // obtiene la api del sobre
  return new docusign.EnvelopesApi(client);
}
function getEnvelopesStatus(client, envelopeId) {
  // obtiene los datos del sobre
  const envelopesApi = new docusign.EnvelopesApi(client);
  const envelope = envelopesApi.getEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, envelopeId);

  return envelope;
}
async function getEnvelopeDocuments(client, envelopeId) {
  const envelopesApi = new docusign.EnvelopesApi(client);
  // obtiene una lista con los documentos del sobre
  const listDocs = await envelopesApi.listDocuments(process.env.DOCUSIGN_ACCOUNT_ID, envelopeId);
  // obtiene el id del documento
  const documentId = listDocs.envelopeDocuments[0].documentId;
  // obtiene el documento 
  const doc = await envelopesApi.getDocument(process.env.DOCUSIGN_ACCOUNT_ID, envelopeId, documentId);

  return doc;
}
module.exports = { getDocuSignClient, getEnvelopesApi, getEnvelopesStatus, getEnvelopeDocuments };