const request = require('request-promise');
const moment = require('moment');

const apiKey = process.env.SIMILARWEB_KEY;

const getVisitsCount = (domain) =>
  new Promise(async (resolve, reject) => {
    const dateFormat = 'YYYY-MM';
    const startMonth = moment()
      .subtract(1, 'month')
      .format(dateFormat);
    const endMonth = startMonth;
    const url = `https://api.similarweb.com/v1/website/${domain}/total-traffic-and-engagement/visits?api_key=${apiKey}&start_date=${startMonth}&end_date=${endMonth}&main_domain_only=false&granularity=monthly&country=us`;
    const reqOptions = {
      uri: url,
      json: true,
    };

    const trafficData = await request(reqOptions);
    resolve(trafficData.visits[0].visits);
  });

module.exports = {
  getVisitsCount,
};
