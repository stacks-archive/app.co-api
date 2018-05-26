const Promise = require('bluebird');

const { App } = require('../db/models');
const { saveRanking } = require('../common/lib/twitter');
const { clearCache } = require('../common/lib/utils');

const sync = async () => {
  const apps = await App.findAll();
  await Promise.map(apps, (app) => saveRanking(app));
  await clearCache();
  console.log('Done!');
  process.exit();
};

sync();
