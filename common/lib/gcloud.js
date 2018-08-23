const Storage = require('@google-cloud/storage');
const { google } = require('googleapis');
const request = require('request-promise');
const fs = require('fs-extra');
const uuid = require('uuid/v4');
const path = require('path');

const storage = new Storage({});

const setup = async () => {
  const jsonCreds = process.env.GCS_JSON;
  const credsPath = path.join(__dirname, '..', '..', 'gcs.json');
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  await fs.outputFile(credsPath, jsonCreds);
};

const uploadFromURL = (url) =>
  new Promise(async (resolve, reject) => {
    try {
      let buffer;
      try {
        buffer = await request(url, { encoding: null });
      } catch (error) {
        console.log(`Skipping upload of ${url} because request failed.`);
        return resolve();
      }
      const id = uuid();
      const filename = path.join(__dirname, '..', '..', 'tmp', id);

      const gcsPath = `/app.co/apps/${id}`;
      await fs.outputFile(filename, buffer);
      const options = {
        destination: gcsPath,
        public: true,
        resumable: false,
      };
      const file = await storage.bucket(process.env.GCS_BUCKET).upload(filename, options);
      return resolve(file[0]);
    } catch (error) {
      console.log(`Error when uploading ${url} to GCS:`, error);
      return reject(error);
    }
  });

module.exports = { uploadFromURL, setup };
