const { google } = require('googleapis');
const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request-promise');
// const Queue = require('promise-queue');
const Promise = require('bluebird');

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

  static getSheet() {
    const sheets = google.sheets({ version: 'v4', auth: this.auth() });
    const sheetOptions = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'DApps!A:N',
    };
    console.log('Fetching sheet', process.env.GOOGLE_SPREADSHEET_ID);
    return sheets.spreadsheets.values.get(sheetOptions);
  }

  static async transformRows(rows) {
    const headers = rows[0];
    console.log(headers);
    // const headerToAttribute = this.headerToAttribute();
    /* eslint no-plusplus: 0 */
    // const queue = new Queue(1, Infinity);
    const apps = await Promise.map(_.slice(rows, 1), (row) => this.transformRow(row, headers), { concurrency: 1 });
    // const apps = await queue.add(appTransactions);
    // const apps = [];
    // for (let index = 0; index < appTransactions.length; index++) {
    //   const transaction = appTransactions[index];
    //   apps.push(await transaction());
    // }
    // console.log(rows.length, appTransactions.length);
    // const apps = await Promise.all(appTransactions);
    console.log('Done!');
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
      // console.log(attrs);
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const attribute = headerToAttribute[headers[i]];
        // console.log(attribute, attr);
        data[attribute] = attr || null;
      }
      if (!data.name) {
        return resolve(null);
      }
      console.log(data);
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
        let [app] = await App.findOrBuild({
          where: { website: data.website },
        });
        app = await app.update(data);
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
      const response = await this.getSheet();
      const headers = response.data.values[0];
      const headerToAttribute = this.headerToAttribute();
      const rowData = headers.map((header) => {
        const attr = headerToAttribute[header];
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
};
