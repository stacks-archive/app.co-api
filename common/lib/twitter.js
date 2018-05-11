const Twitter = require('twitter');
const each = require('async/each');
const URL = require('url');
const getBearerToken = require('get-twitter-bearer-token');

const { Ranking } = require('../../db/models');

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_KEY,
  consumer_secret: process.env.TWITTER_SECRET,
  bearer_token: process.env.TWITTER_BEARER_TOKEN,
});

const fetchPage = async function fetchPage(app, _options, _lastCount, _totalMentions, _lastId) {
  let [lastCount, totalMentions, lastId] = [_lastCount, _totalMentions, _lastId];
  const options = _options;
  return new Promise(async (resolve, reject) => {
    if (lastId) {
      options.max_id = lastId;
    }
    twitter.get('search/tweets', options, (error, tweets) => {
      if (error || !tweets) {
        reject(error);
      } else {
        const { statuses } = tweets;
        lastCount = statuses.length;
        totalMentions += statuses.length;
        if (lastCount === 100) {
          lastId = statuses[99].id;
        }
        resolve([lastId, lastCount, totalMentions]);
      }
    });
  });
};

const paginateMentions = (app) =>
  new Promise(async (resolve, reject) => {
    let lastCount = 100;
    let lastId = null;
    let totalMentions = 0;

    if (app.website && app.website.length > 0) {
      const { hostname } = URL.parse(app.website);
      if (!hostname || hostname.length === 0) {
        return resolve(totalMentions);
      }
      const options = { q: encodeURIComponent(hostname), count: 100 };
      try {
        while (lastCount === 100) {
          /* eslint no-await-in-loop: [0] */
          [lastId, lastCount, totalMentions] = await fetchPage(app, options, lastCount, totalMentions, lastId);
        }
        resolve(totalMentions);
      } catch (error) {
        reject(error);
      }
    } else {
      resolve(totalMentions);
    }
  });

const saveRanking = (app) =>
  new Promise(async (resolve, reject) => {
    try {
      const totalMentions = await paginateMentions(app);
      const attributes = {
        appId: app.id,
        date: new Date(),
      };
      let [ranking] = await Ranking.findOrBuild({
        where: attributes,
        defaults: attributes,
      });
      attributes.twitterMentions = totalMentions;
      ranking = await ranking.update(attributes);
      resolve(ranking);
    } catch (error) {
      reject(error);
    }
  });

const fetchMentions = (apps) =>
  new Promise(async (resolve, reject) => {
    each(apps, paginateMentions, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const bearerToken = () =>
  new Promise(async (resolve, reject) => {
    getBearerToken(process.env.TWITTER_KEY, process.env.TWITTER_SECRET, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.body.access_token);
      }
    });
  });

module.exports = {
  fetchMentions,
  paginateMentions,
  saveRanking,
  client: twitter,
  bearerToken,
};
