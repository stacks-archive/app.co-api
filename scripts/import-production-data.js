const request = require('request-promise');

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
          let newApp = await App.findOne({ where: { name } });
          if (newApp) {
            console.log('Found existing app:', app.name);
          } else {
            console.log('Creating new app:', app.name);
            newApp = await App.create(app);
          }
          await newApp.setDefaultSlug();
          await setRanking(app, newApp);
          resolve(newApp);
        } catch (error) {
          reject(error);
        }
      }),
  );

  await Promise.all(importAppPromises);
  // await clearCache();
  console.log('Done');
  process.exit();
};

fetchData();
