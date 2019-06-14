const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const secure = require('express-force-https');
const { Op } = require('sequelize');
const request = require('request-promise');
const sortBy = require('lodash/sortBy');
const Promise = require('bluebird');
const morgan = require('morgan');
const crypto = require('crypto');

require('dotenv').config();

const { App, MiningMonthlyReport } = require('./db/models');
const ENUMS = require('./db/models/constants/app-constants');
const { saveRanking } = require('./common/lib/twitter');
const { setup } = require('./common/lib/gcloud');
const appConstants = require('./db/models/constants/app-constants');
const AdminController = require('./controllers/admin-controller');
const UserController = require('./controllers/user-controller');
const MakerController = require('./controllers/maker-controller');

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
    where: {
      categoryID: {
        [Op.ne]: ENUMS.categoryEnums['Sample Blockstack Apps'],
      },
      BTCAddress: {
        [Op.or]: {
          [Op.ne]: null,
          [Op.ne]: '',
        },
      },
      isKYCVerified: true,
      status: 'accepted',
    },
    attributes: { exclude: ['status', 'notes', 'isKYCVerified', 'BTCAddress', 'contactEmail', 'submitterName'] },
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
        isKYCVerified: {
          [Op.or]: {
            [Op.eq]: false,
            [Op.eq]: null,
          },
        },
      },
      status: 'accepted',
    },
    attributes: { exclude: ['status', 'notes', 'isKYCVerified', 'BTCAddress'] },
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

app.post('/api/eversign-webhook', async (req, res) => {
  try {
    const { event_time, event_type, event_hash, meta } = req.body;
    const hmac = crypto
      .createHmac('sha256', process.env.EVERSIGN_TOKEN)
      .update(`${event_time}${event_type}`)
      .digest('hex');
    if (hmac === event_hash) {
      console.log(`Eversign webhook: ${event_type}`);
      if (event_type === 'document_signed') {
        const { related_document_hash } = meta;
        const _app = await App.findOne({ where: { eversignDocumentID: related_document_hash } });
        if (_app) {
          console.log(`Document signed for app: ${_app.name}`);
          await _app.update({
            hasAcceptedSECTerms: true,
          });
        } else {
          console.log('No app found for this document');
        }
      }
      res.status(200).json({ success: true });
    } else {
      console.error('Invalid HMAC from eversign.');
      res.status(401).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

setup().then(() => {
  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
