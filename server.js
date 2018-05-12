const express = require('express');

require('dotenv').config();

const { App } = require('./db/models');
const { saveRanking } = require('./common/lib/twitter');
const appConstants = require('./db/models/constants/app-constants');

const port = parseInt(process.env.PORT, 10) || 4000;

const app = express();

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

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
