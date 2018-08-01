const Promise = require('bluebird');
require('dotenv').config();

const { App } = require('../db/models');
const { saveRanking } = require('../common/lib/twitter');
const { getAppTrafficData } = require('../common/lib/similarweb');
const { clearCache } = require('../common/lib/utils');

const saveAllRankings = (app) =>
  new Promise(async (resolve, reject) => {
    try {
      const ranking = await saveRanking(app);
      const { visits, bounceRate, pageViews, visitDuration } = await getAppTrafficData(app);
      ranking.monthlyVisitsCount = visits;
      ranking.monthlyBounceRate = bounceRate;
      ranking.monthlyPageViews = pageViews;
      ranking.monthlyVisitDuration = visitDuration;
      await ranking.save();
      resolve(ranking);
    } catch (error) {
      console.log('Error for app:', app.name, error);
      reject(error);
    }
  });

const sync = async () => {
  try {
    const apps = await App.findAll();
    await Promise.map(apps, (app) => saveAllRankings(app));
    await clearCache();
  } catch (error) {
    console.log('Error when saving rankings:', error);
  }
  console.log('Done!');
  process.exit();
};

sync();
