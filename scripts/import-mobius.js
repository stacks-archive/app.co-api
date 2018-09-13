const fs = require('fs-extra');

const { App } = require('../db/models');
const { setup } = require('../common/lib/gcloud');

const saveApps = async () => {
  const appJSON = await fs.readJSON('./common/data/mobius.json');
  // console.log(appJSON[0]);
  await setup();
  const saves = appJSON.map(
    (appData) =>
      new Promise(async (resolve, reject) => {
        try {
          const { name } = appData;
          const [app] = await App.findOrBuild({ where: { name } });
          await app.update({
            name,
            description: appData.tagline,
            imageUrl: appData.image_url,
            website: appData.url,
            blockchain: 'Mobius',
          });
          console.log(app.name, app.id);
          resolve();
        } catch (error) {
          console.log(error);
          reject(error);
        }
      }),
  );
  await Promise.all(saves);
  console.log('done');
  process.exit();
};

saveApps();
