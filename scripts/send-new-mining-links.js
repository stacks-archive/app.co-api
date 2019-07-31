const { Op } = require('sequelize');
const pug = require('pug');
const { resolve } = require('path');
const Promise = require('bluebird');
const { App } = require('../db/models');
const { sendMail, newMagicLinkEmail } = require('../common/lib/mailer');

const run = async () => {
  const apps = await App.findAll({
    where: {
      BTCAddress: {
        [Op.or]: {
          [Op.ne]: null,
          [Op.ne]: '',
        },
      },
      isKYCVerified: true,
      status: 'accepted',
      contactEmail: {
        [Op.or]: {
          [Op.ne]: null,
          [Op.ne]: '',
        },
      },
    },
  });
  const path = resolve('./common/lib/mailer/new-magic-link.pug');
  const renderer = pug.compileFile(path);
  const singleApp = process.env.APP_ID && parseInt(process.env.APP_ID, 10);
  await Promise.map(apps, async (app) => {
    if (!singleApp || app.id === singleApp) {
      const mail = newMagicLinkEmail(app, renderer);
      await sendMail(mail);
    }
  });
  // const app = apps[0];
  // console.log(app);
  // console.log(apps.length);
  // console.log(mail);
};

run()
  .catch((e) => console.log(e))
  .finally(() => process.exit());
