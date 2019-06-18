const request = require('request-promise');

const api = 'https://netverify.com/api/v4/initiate';

const createVerification = async (app) => {
  const { SERVER_URL, JUMIO_TOKEN, JUMIO_SECRET } = process.env;
  const callbackUrl = `${SERVER_URL}/api/jumio/success`;

  const data = {
    customerInternalReference: app.id.toFixed(),
    userReference: app.name,
    callbackUrl,
    // workflowId: 200,
  };

  const response = await request.post({
    uri: api,
    json: true,
    body: data,
    auth: {
      username: JUMIO_TOKEN,
      password: JUMIO_SECRET,
    },
  });

  await app.update({
    jumioTransactionID: response.transactionReference,
    jumioEmbedURL: response.redirectURL,
  });

  return response.redirectURL;
};

module.exports = {
  createVerification,
};
