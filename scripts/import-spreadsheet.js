require('dotenv').config();
const GSheets = require('../common/lib/gsheets');

GSheets.import().then(() => {
  console.log('done!');
  process.exit();
});
