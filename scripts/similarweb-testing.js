require('dotenv').config();
const { getVisitsCount, getBounceRate, getVisitDuration, getPageViews } = require('../common/lib/similarweb');

const getInfo = async () => {
  const data = await getVisitsCount('cryptokitties.co');
  console.log(data);
  console.log(await getBounceRate('cryptokitties.co'));
  console.log(await getPageViews('cryptokitties.co'));
  console.log(await getVisitDuration('cryptokitties.co'));
};

getInfo();
