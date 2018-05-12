const express = require('express');
const bodyParser = require('body-parser');
const Mailchimp = require('mailchimp-api-v3');
const crypto = require('crypto');

require('dotenv').config();

const mailchimp = new Mailchimp(process.env.MAILCHIMP_KEY);

const { App } = require('./db/models');
const { saveRanking } = require('./common/lib/twitter');
const appConstants = require('./db/models/constants/app-constants');
const GSheets = require('./common/lib/gsheets');

const port = parseInt(process.env.PORT, 10) || 4000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/api/fetch_rankings', async (req, res) => {
  if (process.env.API_KEY === req.query.key) {
    const apps = await App.findAll();
    const fetchRankings = apps.map((appModel) => saveRanking(appModel));
    Promise.all(fetchRankings)
      .then(() => {
        res.send('OK');
      })
      .catch((error) => {
        console.log('api error', error);
        res.status(500).send('API Error.');
      });
  } else {
    res.status(400).send('Bad Request');
  }
});

app.get('/api/apps', async (req, res) => {
  const apps = await App.findAllWithRankings();
  const constants = { appConstants };
  res.json({ apps, constants });
});

app.post('/api/submit', async (req, res, next) => {
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

app.post('/api/subscribe', async (req, res) => {
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

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
