const _ = require('lodash');
const URL = require('url');
const request = require('request-promise');

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
      blockExplorerUrl: {
        type: DataTypes.VIRTUAL,
        get() {
          return process.env.BLOCK_EXPLORER_URL;
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
      {
        model: models.MiningAppPayout,
      },
    ];

    MiningMonthlyReport.MiningReviewerReport = MiningMonthlyReport.hasMany(models.MiningReviewerReport, {
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    });

    MiningMonthlyReport.MiningAppPayout = MiningMonthlyReport.hasMany(models.MiningAppPayout, {
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    });

    MiningMonthlyReport.App = models.App;

    MiningMonthlyReport._models = models;
  };

  // MiningMonthlyReport.getCompositeRankings = async (id) => {
  //   const report = await MiningMonthlyReport.findById(id, { include: MiningMonthlyReport.includeOptions });

  // };

  MiningMonthlyReport.prototype.getCompositeRankings = function getCompositeRankings() {
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
      rankings: app.rankings,
    }));
  };

  MiningMonthlyReport.prototype.savePaymentInfo = async function savePaymentInfo(txId) {
    const tx = await request({
      uri: `${process.env.BLOCK_EXPLORER_API}/${txId}`,
      json: true,
    });

    const savePromises = tx.outputs.map(
      (output) =>
        new Promise(async (resolve, reject) => {
          try {
            const [BTCAddress] = output.addresses;
            const app = await MiningMonthlyReport.App.findOne({
              where: { BTCAddress },
            });
            if (app) {
              // console.log(MiningMonthlyReport.MiningAppPayout);
              // return resolve();
              const paymentAttrs = {
                appId: app.id,
                reportId: this.id,
              };
              // console.log(paymentAttrs);
              const [payment] = await MiningMonthlyReport._models.MiningAppPayout.findOrBuild({
                where: paymentAttrs,
                defaults: paymentAttrs,
              });
              await payment.update({
                ...paymentAttrs,
                BTCPaymentValue: output.value,
              });
              // console.log(payment.dataValues);
              return resolve(payment);
            }
            console.log('Could not find app with address:', BTCAddress);
            return resolve();
          } catch (error) {
            console.log(error);
            return reject(error);
          }
        }),
    );

    await Promise.all(savePromises);

    // console.log(tx);
  };

  return MiningMonthlyReport;
};
