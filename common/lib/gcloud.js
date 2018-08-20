const Storage = require('@google-cloud/storage');
const { google } = require('googleapis');
const request = require('request-promise');
const fs = require('fs-extra');
const uuid = require('uuid/v4');
const path = require('path');

const oauthClient = new google.auth.OAuth2(process.env.GCS_KEY, process.env.GCS_SECRET);

const storage = new Storage({
  projectId: 'blockstack-team',
  authClient: oauthClient,
  credentials: {
    client_email: process.env.GCS_KEY,
    private_key: process.env.GCS_SECRET,
  },
});

const uploadFromURL = (url) =>
  new Promise(async (resolve, reject) => {
    try {
      const buffer = await request(url, { encoding: null });
      // const filename = path.join(__dirname, '..', '..', 'tmp', uuid());
      // console.log(filename);

      // await fs.outputFile(filename, buffer);
      // const file = await storage.bucket(process.env.GCS_BUCKET).upload(filename);
      // return resolve(file);

      const options = {
        method: 'POST',
        uri: `https://www.googleapis.com/upload/storage/v1/b/blockstack-imgix/o?uploadType=media&name=testObject&key=${
          process.env.GCS_API_KEY
        }`,
        headers: {
          // Authorization: `Bearer ${process.env.GCS_KEY}`,
        },
        body: buffer,
      };
      const response = await request(options);
      return resolve(response);
    } catch (error) {
      console.log(`Error when uploading ${url} to GCS:`, error);
      return reject(error);
    }
  });

module.exports = { uploadFromURL };
