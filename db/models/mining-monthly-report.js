const _ = require('lodash');
const URL = require('url');
const request = require('request-promise');
const accounting = require('accounting');
const moment = require('moment-timezone');

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
      name: DataTypes.STRING,
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
      monthName: {
        type: DataTypes.VIRTUAL,
        get() {
          return [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ][this.month - 1];
        },
      },
      humanReadableDate: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.monthName} ${this.year}`;
        },
      },
      totalRewardsUsd: {
        type: DataTypes.VIRTUAL,
        get() {
          if (!this.MiningAppPayouts) {
            return null;
          }
          let sum = 0;
          this.MiningAppPayouts.forEach((payout) => {
            sum += payout.BTC * this.purchaseConversionRate;
          });
          return sum;
        },
      },
      formattedTotalRewardsUsd: {
        type: DataTypes.VIRTUAL,
        get() {
          return accounting.formatMoney(this.totalRewardsUsd);
        },
      },
      friendlyPurchasedAt: {
        type: DataTypes.VIRTUAL,
        get() {
          const date = moment(this.purchasedAt).tz('America/New_York');
          return `${date.format('MMMM D, YYYY')} at ${date.format('h:mm a')} EST`;
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
            separate: true,
            model: models.MiningReviewerRanking,
            include: [
              {
                model: models.App,
                include: [
                  {
                    model: models.Slug,
                    separate: true,
                  },
                ],
              },
            ],
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
      report.MiningReviewerRankings.forEach(({ standardScore, App }) => {
        const app = App.get({ plain: true });
        const [slug] = App.Slugs;
        app.slug = slug ? slug.value : slug;
        app.authentication = App.authentication;
        app.storageNetwork = App.storageNetwork;
        app.blockchain = App.blockchain;
        apps[app.id] = apps[app.id] || app;
        apps[app.id].rankings = apps[app.id].rankings || [];
        apps[app.id].rankings.push(standardScore);
      });
    });
    const { purchaseConversionRate, MiningAppPayouts } = this;
    const weighted = (score) => {
      const theta = 0.5;
      if (score >= 0) {
        return score ** theta;
      }
      return -((-score) ** theta);
    };
    const sorted = _.sortBy(Object.values(apps), (app) => {
      const { rankings } = app;
      let sum = 0;
      rankings.forEach((ranking) => {
        sum += weighted(ranking);
      });
      const avg = sum / rankings.length;
      const { hostname } = URL.parse(app.website);
      let payout;
      MiningAppPayouts.forEach((appPayout) => {
        if (appPayout.appId === app.id) {
          payout = appPayout;
        }
      });
      // console.log(payout.dataValues);
      if (payout) {
        app.usdRewards = purchaseConversionRate * payout.BTC;
        app.formattedUsdRewards = accounting.formatMoney(app.usdRewards);
      }
      app.payout = payout;
      app.domain = hostname;
      app.averageRanking = avg;
      apps[app.id] = app;
      return -avg;
    });
    return sorted.map((app) => ({
      ...app,
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
              where: {
                BTCAddress: {
                  [sequelize.Op.iLike]: BTCAddress,
                },
              },
            });
            if (app) {
              console.log('Making payout for', app.name);
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
              console.log(payment.dataValues);
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
