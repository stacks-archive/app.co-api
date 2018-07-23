const request = require('request-promise');
const moment = require('moment');

const apiKey = process.env.SIMILARWEB_KEY;

const getEndpoint = (domain, endpoint) =>
  new Promise(async (resolve, reject) => {
    const dateFormat = 'YYYY-MM';
    const startMonth = moment()
      .subtract(1, 'month')
      .format(dateFormat);
    const endMonth = startMonth;
    const url = `https://api.similarweb.com/v1/website/${domain}/total-traffic-and-engagement/${endpoint}?api_key=${apiKey}&start_date=${startMonth}&end_date=${endMonth}&main_domain_only=false&granularity=monthly&country=us`;
    const reqOptions = {
      uri: url,
      json: true,
    };
    try {
      const data = await request(reqOptions);
      const key = endpoint.replace(/-/g, '_');
      resolve(data[key][0][key]);
    } catch (error) {
      reject(error);
    }
  });

const getVisitsCount = (domain) => getEndpoint(domain, 'visits');
const getBounceRate = (domain) => getEndpoint(domain, 'bounce-rate');
const getPageViews = (domain) => getEndpoint(domain, 'pages-per-visit');
const getVisitDuration = (domain) => getEndpoint(domain, 'average-visit-duration');

const getTrafficData = (domain) =>
  new Promise(async (resolve, reject) => {
    try {
      const [visits, bounceRate, pageViews, visitDuration] = await Promise.all([
        getVisitsCount(domain),
        getBounceRate(domain),
        getPageViews(domain),
        getVisitDuration(domain),
      ]);
      return resolve({
        visits,
        bounceRate,
        pageViews,
        visitDuration,
      });
    } catch (error) {
      return reject(error);
    }
  });

module.exports = {
  getVisitsCount,
  getBounceRate,
  getPageViews,
  getVisitDuration,
  getTrafficData,
};
