const request = require('request-promise');

const api = 'https://netverify.com/api/v4/initiate';

const createVerification = async (app) => {
  const { SERVER_URL, JUMIO_TOKEN, JUMIO_SECRET, JUMIO_CALLBACK_TOKEN } = process.env;
  const callbackUrl = `${SERVER_URL}/api/jumio/success?token=${JUMIO_CALLBACK_TOKEN}`;

  const data = {
    customerInternalReference: app.id.toFixed(),
    userReference: app.name,
    callbackUrl,
    // successUrl: 'https://example.com',
    // errorUrl: 'https://example.com',
    // locale: 'en',
    // reportingCriteria: 'asdf',
    // tokenLifetimeInMinutes: 5,
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
    headers: {
      'User-Agent': 'Blockstack app-co/1.0',
    },
  });

  await app.update({
    jumioTransactionID: response.transactionReference,
    jumioEmbedURL: response.redirectUrl,
  });

  console.log(response);

  return response.redirectUrl;
};

module.exports = {
  createVerification,
};
