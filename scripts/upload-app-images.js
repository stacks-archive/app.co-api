require('dotenv').config();
const { Op } = require('sequelize');

const { uploadFromURL, setup } = require('../common/lib/gcloud');
const { App } = require('../db/models');

const uploadApp = async () => {
  await setup();
  const apps = await App.findAll({
    where: {
      imageUrl: {
        [Op.ne]: null,
      },
    },
  });
  const uploadPromises = apps.map((app) => app.uploadToGCS({}));
  await Promise.all(uploadPromises);
  console.log('done');
  process.exit();
};

uploadApp();
