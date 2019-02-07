const request = require('request-promise');

const register = async (app, referralCode, refSource) => {
  const { VIRAL_LOOPS_KEY } = process.env;
  if (!VIRAL_LOOPS_KEY) {
    console.debug('No Viral Loops key. Skipping action.');
    return true;
  }
  console.debug('Sending registration to viral loops.');
  const { name, description, website, category, storageNetwork, authentication } = app;
  const reqData = {
    apiToken: VIRAL_LOOPS_KEY,
    params: {
      event: 'registration',
      user: {
        firstName: app.submitterName,
        email: app.contactEmail,
        extraData: {
          name,
          description,
          website,
          category,
          storageNetwork,
          authentication,
        },
      },
      referrer: {
        referralCode,
      },
      refSource,
    },
  };
  console.log('Viral loops registration:\n', JSON.stringify(reqData, null, 2));
  const response = await request.post({
    json: true,
    uri: 'https://app.viral-loops.com/api/v2/events',
    body: reqData,
  });
  console.log('Viral Loops response:', JSON.stringify(response, null, 2));

  return true;
};

module.exports = register;
