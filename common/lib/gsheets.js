const { google } = require('googleapis');
const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request-promise');
// const Queue = require('promise-queue');
const Promise = require('bluebird');
const { Op } = require('sequelize');
const moment = require('moment');

const { App } = require('../../db/models');

module.exports = class GSheets {
  static auth() {
    const oauthClient = new google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_SECRET);
    oauthClient.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return oauthClient;
  }

  static import() {
    return new Promise(async (resolve, reject) => {
      const response = await this.getSheet();
      resolve(this.transformRows(response.data.values));
    });
  }

  static getSheet(sheetName = 'DApps') {
    const sheets = google.sheets({ version: 'v4', auth: this.auth() });
    const sheetOptions = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    };
    console.log('Fetching sheet', process.env.GOOGLE_SPREADSHEET_ID);
    return sheets.spreadsheets.values.get(sheetOptions);
  }

  static async transformRows(rows) {
    const headers = rows[0];
    const apps = await Promise.map(_.slice(rows, 1), (row) => this.transformRow(row, headers), { concurrency: 3 });
    return apps;
  }

  static transformRow(row, headers) {
    return new Promise(async (resolve) => {
      const data = {};
      const headerToAttribute = this.headerToAttribute();
      const attrPromises = _.map(headers, (header, i) => {
        const columnData = row[i];
        const attribute = headerToAttribute[headers[i]];
        return this.transformValue(attribute, columnData);
      });
      const attrs = await Promise.all(attrPromises);
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const attribute = headerToAttribute[headers[i]];
        data[attribute] = attr || null;
      }
      if (!data.name) {
        return resolve(null);
      }
      // console.log(data);
      const app = await this.makeApp(data);
      resolve(app);
    });
  }

  static headerToAttribute() {
    return {
      Name: 'name',
      Category: 'category',
      Blockchains: 'blockchain',
      Website: 'website',
      Storage: 'storageNetwork',
      Authentication: 'authentication',
      'Open Source Client?': 'openSourceUrl',
      'Registration Open?': 'registrationIsOpen',
      Description: 'description',
      Image: 'imageUrl',
      Contact: 'contact',
      'Twitter Handle': 'twitterHandle',
    };
  }

  static attributeToHeader() {
    return _.invert(this.headerToAttribute());
  }

  static transformValue(attribute, value) {
    return new Promise(async (resolve) => {
      if (['registrationIsOpen'].indexOf(attribute) !== -1) {
        resolve(value === 'YES');
      } else if (attribute === 'imageUrl') {
        const url = await this.getImageURL(value);
        resolve(url);
      }
      resolve(value);
    });
  }

  static makeApp(data) {
    return new Promise(async (resolve, reject) => {
      try {
        let app = await App.findOne({
          where: { name: { [Op.iLike]: data.name } },
        });
        if (app) {
          app = await app.update(data);
        } else {
          const attrs = _.extend(data, { status: 'pending_audit' });
          app = await App.create(attrs);
        }
        resolve(app);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  static getImageURL(url) {
    return new Promise(async (resolve) => {
      if (url && url.indexOf('photos.app.goo') !== -1) {
        const response = await request(url);
        const $ = cheerio.load(response);
        const meta = $('meta[property="og:image"]');
        resolve(meta.attr('content'));
      }
      resolve(url);
    });
  }

  static append(appData) {
    return new Promise(async (resolve) => {
      const response = await this.getSheet('Submissions');
      const headers = response.data.values[0];
      const headerToAttribute = this.headerToAttribute();
      const rowData = headers.map((header) => {
        const attr = headerToAttribute[header];
        if (attr === 'registrationIsOpen') {
          return appData[attr] ? 'YES' : 'NO';
        }
        return appData[attr];
      });
      const sheets = google.sheets({ version: 'v4', auth: this.auth() });
      console.log('Appending row:', rowData);
      const sheetOptions = {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Submissions!A1:N1',
        resource: {
          values: [rowData],
        },
        valueInputOption: 'USER_ENTERED',
      };
      const appendResponse = await sheets.spreadsheets.values.append(sheetOptions);
      resolve(appendResponse);
    });
  }

  static appendAppMiningSubmission(submission) {
    return new Promise(async (resolve, reject) => {
      try {
        const rows = [
          submission.firstName,
          submission.lastName,
          submission.email,
          submission.appName,
          submission.website,
          submission.isBlockstackIntegrated,
          submission.repo,
          submission.appIsPublic,
          moment().format('YYYY-MM-DD h:mm a'),
        ];

        const sheets = google.sheets({ version: 'v4', auth: this.auth() });
        console.log('Appending row to app mining submissions:', rows);
        const sheetOptions = {
          spreadsheetId: process.env.APP_MINING_SPREADSHEET_ID,
          range: 'Submissions!A1:N1',
          resource: {
            values: [rows],
          },
          valueInputOption: 'USER_ENTERED',
        };
        const appendResponse = await sheets.spreadsheets.values.append(sheetOptions);
        resolve(appendResponse);
      } catch (error) {
        console.log('Error when appending app submission to gsheets:', error);
        reject(error);
      }
    });
  }
};
