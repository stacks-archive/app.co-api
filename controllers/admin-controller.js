const express = require('express');
const jwt = require('express-jwt');
const _ = require('lodash');
const { Op } = require('sequelize');
const papa = require('papaparse');
const Promise = require('bluebird');

const { App, MiningMonthlyReport, MiningReviewerReport, MiningReviewerRanking } = require('../db/models');
const { clearCache } = require('../common/lib/utils');

const router = express.Router();

router.use(jwt({ secret: process.env.JWT_SECRET }));

const { admins } = require('../config/config.json');

router.use((req, res, next) => {
  if (!req.user) {
    return next(); // handled by express-jwt
  }
  if (admins.indexOf(req.user.data.username) === -1) {
    return res.status(400).json({ success: false });
  }
  return next();
});

const updatableKeys = [
  'name',
  'contact',
  'website',
  'description',
  'imageUrl',
  'category',
  'blockchain',
  'authentication',
  'storageNetwork',
  'openSourceUrl',
  'twitterHandle',
  'notes',
  'status',
  'isKYCVerified',
  'BTCAddress',
  'contactEmail',
  'stacksAddress',
  'hasCollectedKYC',
  'hasAcceptedSECTerms',
  'hasAcceptedTerms',
];

router.post('/apps/:appId', async (req, res) => {
  let app = await App.findOne({ ...App.includeOptions, where: { id: req.params.appId } });
  console.log(`Saving ${app.name}`);
  const data = _.pick(req.body, updatableKeys);
  console.log(data);

  app = await app.update(data);
  await clearCache();

  res.json({ success: true, app });
});

router.post('/apps/:appId/reset-id-verification', async (req, res) => {
  try {
    const app = await App.findOne({ where: { id: req.params.appId } });
    console.log('Resetting ID verification for', app.name);
    if (app.hasCollectedKYC) {
      return res.status(400).json({ success: false });
    }
    await app.update({
      jumioTransactionID: null,
      jumioEmbedURL: null,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

router.post('/apps/:appId/reset-participation-agreement', async (req, res) => {
  try {
    const app = await App.findOne({ where: { id: req.params.appId } });
    console.log('Resetting participation agreement for', app.name);
    if (app.hasCollectedKYC) {
      return res.status(400).json({ success: false });
    }
    await app.update({
      eversignDocumentID: null,
      hasAcceptedSECTerms: null,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

router.get('/apps/pending', async (req, res) => {
  try {
    const apps = await App.findAll({
      where: {
        status: {
          [Op.eq]: 'pending_audit',
        },
      },
    });
    // console.log(apps);
    res.json({ apps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.get('/apps/:appId', async (req, res) => {
  try {
    const app = await App.findOne({ ...App.includeOptions, where: { id: req.params.appId } });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.get('/apps', async (req, res) => {
  const apps = await App.findAllWithRankings(true);
  res.json({ apps });
});

router.get('/monthly-reports', async (req, res) => {
  let reports = await MiningMonthlyReport.findAll({
    include: MiningMonthlyReport.includeOptions,
  });
  reports = await Promise.map(reports, async (report) => {
    const month = report.get();
    month.compositeRankings = await report.getCompositeRankings();
    return month;
  });
  res.json({ reports });
});

router.post('/monthly-reports/:id/upload', async (req, res) => {
  console.log(req.params);
  const reportId = req.params.id;
  console.log(req.body);
  const { reviewerName, summary, apps } = req.body;
  // const month = await MiningMonthlyReport.findById(reportId);
  const reviewerAttrs = {
    reportId,
    reviewerName,
  };
  const [reviewer] = await MiningReviewerReport.findOrCreate({
    where: reviewerAttrs,
    defaults: {
      ...reviewerAttrs,
      summary,
    },
  });
  await reviewer.update({ summary });
  const saveAppReviews = apps.map(
    (appParams) =>
      new Promise(async (resolve, reject) => {
        try {
          const dev = process.env.API_ENV !== 'production';
          const idAttr = dev ? 'productionId' : 'id';
          const app = await App.findOne({ where: { [idAttr]: appParams.appId } });
          if (!app) {
            if (dev) {
              return resolve();
            }
            return reject(new Error(`Spreadsheet contains app ID "${appParams.appId}" that fails to match.`));
          }
          const appAttrs = { appId: app.id, reviewerId: reviewer.id, reportId };
          const [appReview] = await MiningReviewerRanking.findOrBuild({
            where: appAttrs,
            defaults: appAttrs,
          });
          await appReview.update({
            ...appAttrs,
            standardScore: appParams['Final Standardized Score'],
          });
          resolve(appReview);
        } catch (error) {
          console.log(error);
          reject(error);
        }
      }),
  );
  try {
    await Promise.all(saveAppReviews);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

const updateableReportKeys = [
  'purchaseExchangeName',
  'purchasedAt',
  'purchaseConversionRate',
  'BTCTransactionId',
  'status',
  'name',
];

router.post('/monthly-reports/:id', async (req, res) => {
  const data = _.pick(req.body, updateableReportKeys);
  // console.log(data);
  const report = await MiningMonthlyReport.findById(req.params.id, { include: MiningMonthlyReport.includeOptions });
  await report.update(data);
  if (data.BTCTransactionId) {
    await report.savePaymentInfo(data.BTCTransactionId);
  }
  res.json({ success: true });
});

router.delete('/monthly-reports/:monthId/reviewers/:id', async (req, res) => {
  const reviewer = await MiningReviewerReport.findById(req.params.id);
  await reviewer.destroy();
  await clearCache();
  // console.log(reviewer);
  res.json({ success: true });
});

router.get('/mining-ready-apps', async (req, res) => {
  const apps = await App.findAll({
    where: App.MiningReadyQuery,
  });
  // console.log(apps[0].dataValues);
  const appRows = apps.map((app) => ({
    'App Id': app.id,
    'App Name': app.name,
    Website: app.website,
    Description: app.description,
    'Image Url': app.imgixImageUrl,
    Email: app.contactEmail,
  }));
  const csv = papa.unparse(appRows);
  return res.status(200).send(csv);
});

router.get('/mining-reports/:monthId/download-rankings', async (req, res) => {
  const includeOptions = [
    { ..._.cloneDeep(MiningMonthlyReport.includeOptions[0]) },
    { ...MiningMonthlyReport.includeOptions[1] },
  ];
  includeOptions[0].include[0].include[0].attributes.exclude = [];
  const month = await MiningMonthlyReport.findById(req.params.monthId, { include: includeOptions });
  month.compositeRankings = await month.getCompositeRankings();
  const rankings = month.compositeRankings.map((app) => {
    const appData = {
      ...app,
      rankings: app.rankings.join(','),
    };
    return appData;
  });
  const csv = papa.unparse(rankings);
  return res.status(200).send(csv);
});

router.get('/download-apps', async (req, res) => {
  const apps = await App.findAll();
  const csv = papa.unparse(apps.map((app) => app.get()));
  return res.status(200).send(csv);
});

module.exports = router;
