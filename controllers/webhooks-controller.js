const express = require('express');
const crypto = require('crypto');
const { App } = require('../db/models');

const Router = express.Router();

Router.post('/eversign-webhook', async (req, res) => {
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

Router.post('/jumio/success', async (req, res) => {
  const { jumioIdScanReference, verificationStatus } = req.body;
  const { token } = req.query;
  console.log(req.body);
  console.log(`Jumio Callback. Status: ${verificationStatus}. Transaction: ${jumioIdScanReference}`);
  if (token !== process.env.JUMIO_CALLBACK_TOKEN) {
    console.error('Invalid callback token. Rejecting.');
    return res.status(500).json({ success: false });
  }
  if (verificationStatus === 'APPROVED_VERIFIED') {
    const app = await App.findOne({ where: { jumioTransactionID: jumioIdScanReference } });
    if (app) {
      await app.update({ hasCollectedKYC: true });
      return res.json({ success: true });
    }
    console.log('No app found with given Jumio transaction');
    return res.status(404).json({ success: false });
  }
  return res.json({ success: true });
});

module.exports = Router;
