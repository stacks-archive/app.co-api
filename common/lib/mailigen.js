const request = require('request-promise');

const apiUrl = 'https://api.mailigen.com/1.3/?output=json';

const subscribe = async (email, mergeVars = {}) => {
  const data = {
    id: process.env.MAILIGEN_LIST,
    email_address: email,
    merge_vars: mergeVars,
    update_existing: true,
    double_optin: false,
    apikey: process.env.MAILIGEN_API_KEY,
  };

  const response = await request({
    uri: `${apiUrl}&method=listSubscribe`,
    form: data,
    method: 'POST',
  });

  console.log('Response from Mailigen:', response);

  return response;
};

module.exports = {
  subscribe,
};
