const express = require('express');
const _ = require('lodash');
const { App } = require('../db/models');
const { makeDocument, getDocument } = require('../common/lib/eversign');
const { createVerification } = require('../common/lib/jumio');

const Router = express.Router();

Router.use(async (req, res, next) => {
  try {
    const { accessToken } = req.query;
    const app = await App.findOne({
      where: { accessToken },
      attributes: {
        exclude: ['status', 'notes'],
      },
    });
    if (app) {
      req.app = app;
      return next();
    }
    return res.status(400).json({ success: false });
    // return next();
  } catch (error) {
    console.error(error);
    // return next(error);
    return res.status(400).json({ success: false });
  }
});

Router.get('/app', (req, res) => res.json({ app: req.app }));

const updateableKeys = ['BTCAddress', 'stacksAddress'];

Router.post('/app', async (req, res) => {
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

Router.post('/make-participation-agreement', async (req, res) => {
  try {
    const { app } = req;
    if (app.eversignDocumentID) {
      const document = await getDocument(app);
      return res.json({ success: true, embedURL: document.signers[0].embedded_signing_url });
    }
    const { name, email } = req.query;
    const document = await makeDocument(app, name, email);
    await app.update({ eversignDocumentID: document.document_hash });
    return res.json({ success: true, embedURL: document.signers[0].embedded_signing_url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

Router.post('/initiate-kyc', async (req, res) => {
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
