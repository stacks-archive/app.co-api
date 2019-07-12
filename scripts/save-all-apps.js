const { App } = require('../db/models');

const run = async () => {
  const allApps = await App.findAll();
  const saveApps = allApps.map((app) => app.save());
  const savedApps = await Promise.all(saveApps);
  savedApps.forEach((app) => {
    if (!app.accessToken) {
      console.log(`${app.name} has no access token`);
    }
  });
};

run()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    process.exit();
  });
