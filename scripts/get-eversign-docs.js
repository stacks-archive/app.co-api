const dotenv = require('dotenv');
const { getTemplates } = require('../common/lib/eversign');

dotenv.config();

const run = async () => {
  const documents = await getTemplates();
  console.log(documents);
};

run()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    process.exit();
  });
