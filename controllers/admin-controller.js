const express = require('express');
const jwt = require('express-jwt');
const _ = require('lodash');

const { App, MiningMonthlyReport } = require('../db/models');
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

router.get('/apps/pending', async (req, res) => {
  const apps = await App.findAll({
    where: {
      status: 'pending_audit',
    },
  });
  // console.log(apps);
  res.json({ apps });
});

router.get('/apps', async (req, res) => {
  const apps = await App.findAllWithRankings(true);
  res.json({ apps });
});

router.get('/monthly-reports', async (req, res) => {
  const reports = await MiningMonthlyReport.findAll();
  res.json({ reports });
});

module.exports = router;
