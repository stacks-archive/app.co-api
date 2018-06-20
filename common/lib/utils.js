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

// copypasta from https://gist.github.com/mathewbyrne/1280286
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\.+/g, '-') // Replace dots with -
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

module.exports = {
  clearCache,
  slugify,
};
