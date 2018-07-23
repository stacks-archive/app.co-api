require('dotenv').config();
const { getVisitsCount } = require('../common/lib/similarweb');

const getInfo = async () => {
  const data = await getVisitsCount('cryptokitties.co');
  console.log(data);
};

getInfo();
