const express = require('express');
const jwt = require('express-jwt');
const _ = require('lodash');

const { App } = require('../db/models');

const router = express.Router();

router.use(jwt({ secret: process.env.JWT_SECRET }));

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
];

router.post('/apps/:appId', async (req, res) => {
  let app = await App.findOne({ where: { id: req.params.appId } });
  console.log(req.user);
  console.log(app.name);
  console.log(req.body);
  const data = _.pick(req.body, updatableKeys);
  console.log(data);

  app = await app.update(data);

  res.json({ success: true, app });
});

router.get('/apps/pending', async (req, res) => {
  const apps = await App.findAll({
    where: {
      status: 'pending_audit',
    },
  });
  console.log(apps);
  res.json({ apps });
});

router.get('/apps', async (req, res) => {
  const apps = await App.findAllWithRankings(true);
  res.json({ apps });
});

module.exports = router;
