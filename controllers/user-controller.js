const express = require('express');
const Mailchimp = require('mailchimp-api-v3');
const crypto = require('crypto');
const { verifyAuthResponse } = require('blockstack/lib/auth/authVerification');
const { decodeToken } = require('jsontokens');

const { User } = require('../db/models');
const { createToken } = require('../common/lib/auth/token');

const mailchimp = new Mailchimp(process.env.MAILCHIMP_KEY);

const router = express.Router();

router.post('/submit', async (req, res, next) => {
  if (process.env.API_KEY === req.query.key) {
    const appData = req.body;
    console.log('Request to submit app:', req.body);
    try {
      await GSheets.append(appData);
      console.log('Appended.');
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false });
    }
    next();
  } else {
    res.status(400).send('Bad Request');
    next();
  }
});

router.post('/subscribe', async (req, res) => {
  const recipientEmail = req.body.email;
  const recipientEmailHash = crypto
    .createHash('md5')
    .update(recipientEmail)
    .digest('hex');

  const mailchimpUrl = `/lists/${process.env.MAILCHIMP_LIST}/members/${recipientEmailHash}`;
  console.log(mailchimpUrl);
  await mailchimp.put(mailchimpUrl, {
    email_address: recipientEmail,
    status_if_new: 'subscribed',
  });

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
  await user.update({
    blockstackDID: payload.iss,
  });
  console.log(user.id);
  const jwt = createToken(user);

  return res.json({ success: true, token: jwt, user });
});

module.exports = router;
