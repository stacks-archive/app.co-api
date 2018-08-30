const request = require('request-promise');
const moment = require('moment');
const URL = require('url');

const apiKey = process.env.SIMILARWEB_KEY;

const getEndpoint = (domain, endpoint) =>
  new Promise(async (resolve, reject) => {
    const dateFormat = 'YYYY-MM';
    const startMonth = moment()
      .subtract(1, 'day')
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
      // console.log(data);
      if (data.meta.error_message === 'Data not found') {
        return resolve(null);
      }
      return resolve(data[key][0][key]);
    } catch (error) {
      console.log(error);
      return reject(error);
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
      if (error === 'Data not found') {
        console.log(`No traffic data found for ${domain}`);
        return resolve({});
      }
      return reject(error);
    }
  });

const getAppTrafficData = (app) => {
  if (!app.website || app.website.length === 0) {
    return {};
  }
  const { hostname } = URL.parse(app.website);
  if (!hostname || hostname.length === 0) {
    return {};
  }
  return getTrafficData(hostname);
};

module.exports = {
  getVisitsCount,
  getBounceRate,
  getPageViews,
  getVisitDuration,
  getTrafficData,
  getAppTrafficData,
};
