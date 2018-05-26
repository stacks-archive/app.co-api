require('dotenv').config();
const GSheets = require('../common/lib/gsheets');
const { clearCache } = require('../common/lib/utils');

const importFromSpreadsheet = async () => {
  await GSheets.import();
  await clearCache();
  console.log('done!');
  process.exit();
};

importFromSpreadsheet();
