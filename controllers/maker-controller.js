const express = require('express');
const { App } = require('../db/models');

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

module.exports = Router;
