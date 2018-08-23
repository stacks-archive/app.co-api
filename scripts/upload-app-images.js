require('dotenv').config();
const { uploadFromURL, setup } = require('../common/lib/gcloud');

const { App } = require('../db/models');

const uploadApp = async () => {
  await setup();
  const apps = await App.findAll();
  const uploadPromises = apps.map(
    (app) =>
      new Promise(async (resolve, reject) => {
        try {
          const { imageUrl } = app;
          if (imageUrl && imageUrl.length !== 0) {
            console.log(`Uploading image for ${app.name}`);
            // console.log(app.gcsImagePath);
            const file = await uploadFromURL(imageUrl);
            if (!file) {
              return resolve();
            }
            app.gcsImagePath = file.name;
            await app.save();
            console.log(app.name, app.imgixImageUrl);
            resolve();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      }),
  );
  await Promise.all(uploadPromises);
  console.log('done');
  process.exit();
};

uploadApp();
