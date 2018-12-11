const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const secure = require('express-force-https');
const { Op } = require('sequelize');

require('dotenv').config();

const { App, MiningMonthlyReport } = require('./db/models');
const ENUMS = require('./db/models/constants/app-constants');
const { saveRanking } = require('./common/lib/twitter');
const { setup } = require('./common/lib/gcloud');
const appConstants = require('./db/models/constants/app-constants');
const AdminController = require('./controllers/admin-controller');
const UserController = require('./controllers/user-controller');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 4000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

if (!dev) {
  app.use(secure);
}

app.use('/api/admin', AdminController);
app.use('/api', UserController);

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

app.get('/api/app-mining-apps', async (req, res) => {
  const apps = await App.findAll({
    where: {
      BTCAddress: {
        [Op.or]: {
          [Op.ne]: null,
          [Op.ne]: '',
        },
      },
      isKYCVerified: true,
    },
    attributes: { exclude: ['status', 'notes', 'isKYCVerified', 'BTCAddress'] },
    status: 'accepted',
  });
  const months = await MiningMonthlyReport.findAll({
    where: {
      status: 'published',
    },
    include: MiningMonthlyReport.includeOptions,
  });
  apps.forEach((_app, i) => {
    const a = _app.get();
    a.miningReady = true;
    a.lifetimeEarnings = 0;
    apps[i] = a;
  });
  months.forEach((month) => {
    const { purchaseConversionRate } = month;
    apps.forEach((_app, i) => {
      month.MiningAppPayouts.forEach((payout) => {
        if (_app.id === payout.appId) {
          _app.lifetimeEarnings += payout.BTC * purchaseConversionRate;
          apps[i] = _app;
        }
      });
    });
    // console.log()
  });
  const notReady = await App.findAll({
    where: {
      authenticationID: ENUMS.authenticationEnums.Blockstack,
      [Op.or]: {
        BTCAddress: {
          [Op.or]: {
            [Op.eq]: null,
            [Op.eq]: '',
          },
        },
        isKYCVerified: {
          [Op.or]: {
            [Op.eq]: false,
            [Op.eq]: null,
          },
        },
      },
    },
    attributes: { exclude: ['status', 'notes', 'isKYCVerified', 'BTCAddress'] },
    status: 'accepted',
  });
  res.json({
    apps: apps.concat(
      notReady.map((_app) => {
        const a = _app.get();
        a.miningReady = false;
        a.lifetimeEarnings = 0;
        return a;
      }),
    ),
  });
});

app.get('/api/app-mining-months', async (req, res) => {
  const months = await MiningMonthlyReport.findAll({
    where: {
      status: 'published',
    },
    include: MiningMonthlyReport.includeOptions,
  });
  res.json({ months });
});

setup().then(() => {
  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
