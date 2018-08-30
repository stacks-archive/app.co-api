const Promise = require('bluebird');
const moment = require('moment');
const { Op } = require('sequelize');
require('dotenv').config();

const { App, Ranking } = require('../db/models');
const { saveRanking } = require('../common/lib/twitter');
const { getAppTrafficData } = require('../common/lib/similarweb');
const { clearCache } = require('../common/lib/utils');

const findOrFetchWebTrafficData = async (app) => {
  const existingRanking = await Ranking.findOne({
    where: {
      appId: app.id,
      date: {
        [Op.gte]: moment()
          .startOf('month')
          .add(1, 'day')._d,
        [Op.lt]: moment().endOf('month')._d,
      },
      monthlyVisitsCount: {
        [Op.ne]: null,
      },
    },
  });
  if (existingRanking) {
    console.log(`Using existing web traffic rankings for ${app.name}`);
    return {
      visits: existingRanking.monthlyVisitsCount,
      bounceRate: existingRanking.monthlyBounceRate,
      pageViews: existingRanking.monthlyPageViews,
      visitDuration: existingRanking.monthlyVisitDuration,
    };
  }
  console.log(`Fetching fresh web traffic rankings for ${app.name}`);
  try {
    return getAppTrafficData(app);
  } catch (error) {
    console.log(error);
    return true;
  }
};

const saveAllRankings = (app) =>
  new Promise(async (resolve, reject) => {
    try {
      const ranking = await saveRanking(app);
      const { visits, bounceRate, pageViews, visitDuration } = await findOrFetchWebTrafficData(app);
      ranking.monthlyVisitsCount = visits;
      ranking.monthlyBounceRate = bounceRate;
      ranking.monthlyPageViews = pageViews;
      ranking.monthlyVisitDuration = visitDuration;
      await ranking.save();
      setTimeout(() => {
        resolve(ranking);
      }, 500);
    } catch (error) {
      console.log('Error for app:', app.name, error);
      reject(error);
    }
  });

const sync = async () => {
  try {
    const apps = await App.findAll();
    await Promise.map(apps, (app) => saveAllRankings(app), { concurrency: 1 });
    await clearCache();
  } catch (error) {
    console.log('Error when saving rankings:', error);
  }
  console.log('Done!');
  process.exit();
};

sync();
