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

module.exports = Router;
