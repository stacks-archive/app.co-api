const request = require('request-promise');

const clearCache = () =>
  new Promise(async (resolve, reject) => {
    const url = process.env.CLEAR_CACHE_URL;
    console.log(`Clearing cache at URL: ${url}`);
    try {
      await request.get(url);
      resolve();
    } catch (error) {
      reject(error);
    }
  });

module.exports = {
  clearCache,
};
