const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const secure = require('express-force-https');
const { Op } = require('sequelize');
const request = require('request-promise');
const sortBy = require('lodash/sortBy');
const Promise = require('bluebird');
const morgan = require('morgan');

require('dotenv').config();

const { App, MiningMonthlyReport } = require('./db/models');
const ENUMS = require('./db/models/constants/app-constants');
const { saveRanking } = require('./common/lib/twitter');
const { setup } = require('./common/lib/gcloud');
const appConstants = require('./db/models/constants/app-constants');
const AdminController = require('./controllers/admin-controller');
const UserController = require('./controllers/user-controller');
const MakerController = require('./controllers/maker-controller');
const WebhooksController = require('./controllers/webhooks-controller');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 4000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(
  morgan(
    ':remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  ),
);
app.enable('trust proxy');
app.set('trust proxy', () => true);

app.use(cors());

if (!dev) {
  app.use(secure);
}

app.use('/api/admin', AdminController);
app.use('/api/maker', MakerController);
app.use('/api', UserController);
app.use('/api', WebhooksController);

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
    ...App.includeOptions,
    where: App.MiningReadyQuery,
    attributes: { exclude: App.privateColumns },
  });
  let months = await MiningMonthlyReport.findAll({
    where: {
      status: 'published',
    },
    include: MiningMonthlyReport.includeOptions,
  });
  months = await Promise.map(months, async (report) => {
    report.compositeRankings = await report.getCompositeRankings();
    return report;
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
    ...App.includeOptions,
    where: {
      categoryID: {
        [Op.ne]: ENUMS.categoryEnums['Sample Blockstack Apps'],
      },
      authenticationID: ENUMS.authenticationEnums.Blockstack,
      [Op.or]: {
        BTCAddress: {
          [Op.or]: {
            [Op.eq]: null,
            [Op.eq]: '',
          },
        },
        stacksAddress: {
          [Op.or]: {
            [Op.eq]: null,
            [Op.eq]: '',
          },
        },
        isKYCVerified: {
          [Op.ne]: true,
        },
        hasCollectedKYC: {
          [Op.ne]: true,
        },
        hasAcceptedSECTerms: {
          [Op.ne]: true,
        },
      },
      status: 'accepted',
    },
    attributes: { exclude: App.privateColumns },
  });
  const allApps = apps.concat(
    notReady.map((_app) => {
      const a = _app.get();
      a.miningReady = false;
      a.lifetimeEarnings = 0;
      return a;
    }),
  );
  const sortedApps = sortBy(allApps, (_app) => -_app.lifetimeEarnings);
  res.json({
    apps: sortedApps,
  });
});

app.get('/api/app-mining-months', async (req, res) => {
  let months = await MiningMonthlyReport.findAll({
    where: {
      status: 'published',
    },
    include: MiningMonthlyReport.includeOptions,
  });
  months = await Promise.map(months, async (report) => {
    const month = report.get();
    month.compositeRankings = await report.getCompositeRankings();
    return month;
  });
  res.json({ months });
});

app.get('/api/mining-faq', async (req, res) => {
  const faq = await request.get({
    uri: 'https://docs.blockstack.org/develop/faq-data.json',
    json: true,
  });
  res.json(faq);
});

setup().then(() => {
  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
