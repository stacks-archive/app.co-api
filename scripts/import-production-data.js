const request = require('request-promise');
const sequelize = require('sequelize');
const _ = require('lodash');
const Promise = require('bluebird');
require('dotenv').config();

const { App, Ranking, MiningMonthlyReport, MiningReviewerReport, MiningReviewerRanking } = require('../db/models');
const { clearCache } = require('../common/lib/utils');

const apiURL = 'https://api.app.co';

const productionAPI = `${apiURL}/api/apps`;

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
      console.log('Error when saving ranking for app', newApp.name);
      reject(error); // dont reject, move on
    }
  });

const fetchAppMiningData = async () => {
  const monthsURL = `${apiURL}/api/app-mining-months`;
  console.log('fetching app mining data');

  const { months } = await request({
    uri: monthsURL,
    json: true,
  });

  await Promise.map(months, async (report) => {
    const { month, year, name, BTCTransactionId, purchaseExchangeName, purchasedAt, purchaseConversionRate } = report;
    if (month <= 11 && year <= 2018) {
      return true;
    }
    console.log(month, year);

    const existing = await MiningMonthlyReport.findOne({ where: { year, month } });
    if (existing) {
      const rankings = await MiningReviewerRanking.findAll({ where: { reportId: existing.id } });
      const deletes = rankings.map((r) => r.destroy());
      await Promise.all(deletes);
      await existing.destroy();
    }
    const newReport = new MiningMonthlyReport({
      month,
      year,
      name,
      BTCTransactionId,
      purchaseConversionRate,
      purchaseExchangeName,
      purchasedAt,
    });
    await newReport.save();

    return Promise.map(report.MiningReviewerReports, async (reviewerReport) => {
      const newReviewerReport = new MiningReviewerReport({
        reportId: newReport.id,
        reviewerName: reviewerReport.reviewerName,
      });
      await newReviewerReport.save();
      await Promise.map(reviewerReport.MiningReviewerRankings, async (ranking) => {
        const app = await App.findOne({ where: { productionId: ranking.appId } });
        if (!app) {
          return true;
        }
        const newRanking = new MiningReviewerRanking({
          appId: app.id,
          reportId: newReport.id,
          reviewerId: newReviewerReport.id,
          standardScore: ranking.standardScore,
        });
        await newRanking.save();
        return newRanking;
      });
    });
  });
};

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
          const appAttrs = _.omit(app, ['id', 'Slugs', 'Rankings']);
          appAttrs.productionId = app.id;
          console.log(appAttrs.productionId);
          if (newApp) {
            console.log('Found existing app:', app.name);
            await newApp.update(appAttrs);
          } else {
            console.log('Creating new app:', app.name);
            newApp = await App.create(appAttrs);
          }
          await setRanking(app, newApp);
          try {
            await newApp.setDefaultSlug();
          } catch (error) {
            console.log('Slug error for app:', app.name);
          }
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
  // process.exit();
  return true;
};

const run = async () => {
  await fetchData();
  await fetchAppMiningData();
};

run()
  .then(() => {
    console.log('done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(0);
  });
