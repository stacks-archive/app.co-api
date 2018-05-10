require('dotenv').config();
const Importer = require('../common/lib/importer');

Importer.import().then(() => {
  console.log('done!');
});
