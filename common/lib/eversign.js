const request = require('request-promise');

const api = 'https://api.eversign.com/api/document';

const makeDocument = async (app) => {
  const sandbox = !process.env.EVERSIGN_PROD;
  const body = {
    sandbox: sandbox ? 1 : 0,
    template_id: process.env.EVERSIGN_TEMPLATE_ID,
    title: 'App Mining Participation Agreement',
    client: app.name,
    embedded_signing_enabled: 1,
    signers: [
      {
        role: 'App Mining Participant',
        name: app.submitterName || app.name,
        email: app.contactEmail || 'hello@app.co',
      },
    ],
  };
  console.log(process.env.EVERSIGN_TOKEN);
  const url = `${api}?access_key=${process.env.EVERSIGN_TOKEN}&business_id=${process.env.EVERSIGN_BUSINESS_ID}`;
  console.log(url);
  const document = await request.post({
    uri: url,
    json: true,
    body,
  });
  return document;
};

const getDocument = async (app) => {
  let url = `${api}?access_key=${process.env.EVERSIGN_TOKEN}&business_id=${process.env.EVERSIGN_BUSINESS_ID}`;
  url += `&document_hash=${app.eversignDocumentID}`;
  const document = await request.get({
    uri: url,
    json: true,
  });
  return document;
};

const getTemplates = async () => {
  const url = `${api}?access_key=${process.env.EVERSIGN_TOKEN}&business_id=${
    process.env.EVERSIGN_BUSINESS_ID
  }&type=templates`;
  const documents = await request.get({
    uri: url,
    json: true,
  });
  return documents;
};

module.exports = {
  makeDocument,
  getDocument,
  getTemplates,
};
