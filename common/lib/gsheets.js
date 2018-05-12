const { google } = require('googleapis');
const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request-promise');

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
      range: 'DApps!A:M',
    };
    console.log('Fetching sheet', process.env.GOOGLE_SPREADSHEET_ID);
    return sheets.spreadsheets.values.get(sheetOptions);
  }

  static async transformRows(rows) {
    const headers = rows[0];
    console.log(headers);
    const headerToAttribute = this.headerToAttribute();
    /* eslint no-plusplus: 0 */
    const appTransactions = _.map(_.slice(rows, 1), async (row) => {
      const data = {};
      for (let i = 0; i < row.length; i++) {
        const columnData = row[i];
        const attribute = headerToAttribute[headers[i]];
        data[attribute] = await this.transformValue(attribute, columnData);
      }
      return this.makeApp(data);
    });
    const apps = await Promise.all(appTransactions);
    return apps;
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
      if (url.indexOf('photos.app.goo') !== -1) {
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
        range: 'Submissions!A1:M1',
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
