const { Op } = require('sequelize');
const moment = require('moment');

const { Ranking, App } = require('../db/models');

const go = async () => {
  const app = await App.findOne();
  const existingRanking = await Ranking.findOne({
    where: {
      // appId: app.id,
      date: {
        [Op.gte]: moment()
          .startOf('month')
          .add(1, 'day')._d,
        [Op.lt]: moment().endOf('month')._d,
      },
      monthlyVisitsCount: {
        [Op.ne]: null,
      },
    },
  });
  console.log(existingRanking);
  process.exit();
};

go();
