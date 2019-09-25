const express = require('express');
const _ = require('lodash');
const jwt = require('express-jwt');
const { App } = require('../db/models');
const { makeDocument, getDocument } = require('../common/lib/eversign');
const { createVerification } = require('../common/lib/jumio');

const Router = express.Router();

Router.use(jwt({ secret: process.env.JWT_SECRET }));

Router.use(async (req, res, next) => {
  try {
    const { user } = req;
    if (!user || !user.data.username) {
      return res.status(400).json({ success: false });
    }
    const { username } = user.data;
    const apps = await App.findAll({
      where: { adminBlockstackID: username },
      attributes: {
        exclude: ['status', 'notes'],
      },
    });

    if (req.query.appId) {
      const app = apps.find((_app) => String(_app.id) === req.query.appId);
      if (!app) {
        return res.status(404).json({ success: false });
      }
      req.app = app;
    }

    if (req.params.appId) {
      const app = apps.find((_app) => String(_app.id) === req.params.appId);
      if (!app) {
        return res.status(404).json({ success: false });
      }
      req.app = app;
    }
    if (apps.length) {
      req.apps = apps;
      return next();
    }
    return res.status(400).json({ success: false });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ success: false });
  }
});

Router.get('/apps', (req, res) => res.json({ app: req.apps[0], apps: req.apps }));

const updateableKeys = ['BTCAddress', 'stacksAddress'];

Router.post('/apps/:appId', async (req, res) => {
  try {
    const { app } = req;
    const data = _.pick(req.body, updateableKeys);
    await app.update(data);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

Router.post('/apps/:appId/make-participation-agreement', async (req, res) => {
  try {
    const { app } = req;
    if (app.eversignDocumentID) {
      const document = await getDocument(app);
      return res.json({ success: true, embedURL: document.signers[0].embedded_signing_url });
    }
    const { name, email, isUSA } = req.query;
    const document = await makeDocument(app, name, email, isUSA === 'true');
    await app.update({ eversignDocumentID: document.document_hash });
    return res.json({ success: true, embedURL: document.signers[0].embedded_signing_url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

Router.post('/apps/:appId/initiate-kyc', async (req, res) => {
  try {
    const { app } = req;
    if (app.hasCollectedKYC) {
      return res.json({ success: false, error: 'KYC is already completed.' });
    }
    if (app.jumioEmbedURL) {
      return res.json({ success: true, embedURL: app.jumioEmbedURL });
    }
    const embedURL = await createVerification(app);
    return res.json({ success: true, embedURL });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

module.exports = Router;
