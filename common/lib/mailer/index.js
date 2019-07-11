const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const sendMail = (email) =>
  new Promise(async (resolve, reject) => {
    let transport = null;
    if (process.env.NODE_ENV === 'production') {
      transport = sendgridTransport({
        auth: {
          api_user: process.env.SENDGRID_USERNAME,
          api_key: process.env.SENDGRID_PASSWORD,
        },
      });
    } else {
      transport = {
        port: 1025,
        ignoreTLS: true,
      };
    }

    const client = nodemailer.createTransport(transport);
    client.sendMail(email, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });

const newAppEmail = (app) => {
  const url = process.env.STAGING ? 'https://app-co-staging.herokuapp.com' : 'https://app.co';
  return {
    from: app.contact || 'hello@app.co',
    to: 'hello@app.co',
    subject: `A new app was submitted: ${app.name}`,
    text: `
    A new app has been submitted and is pending approval:\n
    ${url}/admin/app?id=${app.id}\n
    Thanks!
    `,
  };
};

const appMagicLinkEmail = (app, renderer) => {
  const url = `https://app.co/maker/${app.accessToken}`;
  const html = renderer({ app, url });
  return {
    from: 'mining@app.co',
    to: app.contactEmail,
    subject: 'Important App Mining Notification: Action Required for Your STX Payout',
    html,
  };
};

module.exports = {
  sendMail,
  newAppEmail,
  appMagicLinkEmail,
};
