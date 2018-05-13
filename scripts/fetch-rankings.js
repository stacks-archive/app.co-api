const Promise = require('bluebird');

const { App } = require('../db/models');
const { saveRanking } = require('../common/lib/twitter');

const sync = async () => {
  const apps = await App.findAll();
  await Promise.map(apps, (app) => saveRanking(app));
  console.log('Done!');
};

sync();
