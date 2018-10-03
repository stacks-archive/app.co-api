const express = require('express');
const { verifyAuthResponse } = require('blockstack/lib/auth/authVerification');
const { decodeToken } = require('jsontokens');
const _ = require('lodash');
const { subscribe } = require('mailigen');

const { App, User } = require('../db/models');
const { createToken } = require('../common/lib/auth/token');
const { sendMail, newAppEmail } = require('../common/lib/mailer');
const GSheets = require('../common/lib/gsheets');
// const { subscribe } = require('../common/lib/mailigen');

const router = express.Router();

const createableKeys = [
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
];

router.post('/submit', async (req, res) => {
  const appData = _.pick(req.body, createableKeys);
  appData.status = 'pending_audit';
  console.log('Request to submit app:', appData);
  try {
    const app = await App.create(appData);
    sendMail(newAppEmail(app));
    res.json({ success: true, app });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

router.post('/subscribe', async (req, res) => {
  console.log('Subscribing', req.body.email);
  const response = await subscribe(
    req.body.email,
    { FROM: 'app.co' },
    {
      update_existing: true,
      double_optin: false,
    },
  );

  console.log('Response from mailigen:', response);

  res.json({ success: true });
});

router.post('/blockstack-subscribe', async (req, res) => {
  console.log('Subscribing', req.body.email);
  const response = await subscribe(
    req.body.email,
    { FROM: 'blockstack.org' },
    {
      id: process.env.MAILIGEN_BLOCKSTACK_LIST,
      update_existing: true,
      double_optin: false,
    },
  );

  console.log('Response from mailigen:', response);

  res.json({ success: true });
});

router.post('/authenticate', async (req, res) => {
  const { authToken } = req.query;
  if (!authToken) {
    return res.status(400).json({ success: false });
  }

  const nameLookupURL = 'https://core.blockstack.org/v1/names/';
  if (!(await verifyAuthResponse(authToken, nameLookupURL))) {
    console.log('Invalid auth response');
    return res.status(400).json({ success: false });
  }

  const { payload } = decodeToken(authToken);
  console.log(payload);

  const userAttrs = {
    blockstackUsername: payload.username,
  };

  const [user] = await User.findOrBuild({ where: userAttrs, defaults: userAttrs });
  userAttrs.blockstackDID = payload.iss;
  await user.update(userAttrs);
  console.log(user.id);
  const jwt = createToken(user);

  return res.json({ success: true, token: jwt, user });
});

router.post('/app-mining-submission', async (req, res) => {
  const submission = req.body;
  await GSheets.appendAppMiningSubmission(submission);
  res.json({ success: true });
});

module.exports = router;
