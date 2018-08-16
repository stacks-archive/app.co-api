const request = require('request-promise');
const sequelize = require('sequelize');

const { App, Ranking } = require('../db/models');
const { clearCache } = require('../common/lib/utils');

const productionAPI = 'https://app-co-api.herokuapp.com/api/apps';

const setRanking = (app, newApp) =>
  new Promise(async (resolve, reject) => {
    const existingRanking = app.Rankings[0];
    if (!existingRanking) {
      return resolve();
    }
    try {
      const attributes = {
        appId: newApp.id,
        date: existingRanking.date,
      };
      const [ranking] = await Ranking.findOrBuild({
        where: attributes,
        defaults: attributes,
      });
      attributes.twitterMentions = existingRanking.twitterMentions;
      attributes.monthlyVisitsCount = existingRanking.monthlyVisitsCount;
      attributes.monthlyBounceRate = existingRanking.monthlyBounceRate;
      attributes.monthlyPageViews = existingRanking.monthlyPageViews;
      attributes.monthlyVisitDuration = existingRanking.monthlyVisitDuration;
      await ranking.update(attributes);
      resolve();
    } catch (error) {
      reject(error);
    }
  });

const fetchData = async () => {
  const reqOptions = {
    uri: productionAPI,
    json: true,
  };

  const data = await request(reqOptions);

  const importAppPromises = data.apps.map(
    (app) =>
      new Promise(async (resolve, reject) => {
        try {
          const { name } = app;
          const nameQuery = sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.toLowerCase());
          let newApp = await App.findOne({ where: { name: nameQuery } });
          if (newApp) {
            console.log('Found existing app:', app.name);
            await newApp.update(app);
          } else {
            console.log('Creating new app:', app.name);
            newApp = await App.create(app);
          }
          await newApp.setDefaultSlug();
          await setRanking(app, newApp);
          resolve(newApp);
        } catch (error) {
          console.log('Import app error', error);
          reject(error);
        }
      }),
  );

  try {
    await Promise.all(importAppPromises);
  } catch (error) {
    console.log('Error in all Promise.all', error);
  }
  await clearCache();
  console.log('Done');
  process.exit();
};

fetchData();
