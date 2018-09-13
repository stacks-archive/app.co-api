const _ = require('lodash');
const URL = require('url');

module.exports = (sequelize, DataTypes) => {
  const MiningMonthlyReport = sequelize.define(
    'MiningMonthlyReport',
    {
      month: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      status: DataTypes.STRING,
      purchaseExchangeName: DataTypes.STRING,
      purchasedAt: DataTypes.DATE,
      purchaseConversionRate: DataTypes.FLOAT,
      BTCTransactionId: DataTypes.STRING,
      compositeRankings: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getCompositeRankings();
        },
      },
    },
    {},
  );
  MiningMonthlyReport.associate = function associate(models) {
    MiningMonthlyReport.includeOptions = [
      {
        model: models.MiningReviewerReport,
        include: [
          {
            model: models.MiningReviewerRanking,
            include: [{ model: models.App }],
          },
        ],
      },
    ];

    MiningMonthlyReport.MiningReviewerReport = MiningMonthlyReport.hasMany(models.MiningReviewerReport, {
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    });
  };

  // MiningMonthlyReport.getCompositeRankings = async (id) => {
  //   const report = await MiningMonthlyReport.findById(id, { include: MiningMonthlyReport.includeOptions });

  // };

  MiningMonthlyReport.prototype.getCompositeRankings = function getCompositeRankings() {
    console.log('get composite rankings');
    const apps = {};
    this.MiningReviewerReports.forEach((report) => {
      report.MiningReviewerRankings.forEach(({ ranking, App }) => {
        const app = App;
        apps[app.id] = apps[app.id] || app;
        apps[app.id].rankings = apps[app.id].rankings || [];
        apps[app.id].rankings.push(ranking);
      });
    });
    // console.log(apps[804]);
    const sorted = _.sortBy(Object.values(apps), (app) => {
      const { rankings } = app;
      let sum = 0;
      rankings.forEach((ranking) => {
        sum += ranking;
      });
      const avg = sum / rankings.length;
      const { hostname } = URL.parse(app.website);
      app.domain = hostname;
      app.averageRanking = avg;
      apps[app.id] = app;
      return avg;
    });
    return sorted.map((app) => ({
      ...app.dataValues,
      domain: app.domain,
      averageRanking: app.averageRanking,
    }));
  };
  return MiningMonthlyReport;
};
