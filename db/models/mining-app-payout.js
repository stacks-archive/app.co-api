module.exports = (sequelize, DataTypes) => {
  const MiningAppPayout = sequelize.define(
    'MiningAppPayout',
    {
      reportId: {
        type: DataTypes.INTEGER,
        unique: 'uniqueByReportApp',
      },
      appId: {
        type: DataTypes.INTEGER,
        unique: 'uniqueByReportApp',
      },
      BTCPaymentValue: DataTypes.INTEGER,
      rank: DataTypes.INTEGER,
      BTC: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.BTCPaymentValue / 10e7;
        },
      },
    },
    {},
  );
  MiningAppPayout.associate = function associate(models) {
    MiningAppPayout.MiningMonthlyReport = MiningAppPayout.belongsTo(models.MiningMonthlyReport, {
      foreignKey: 'reportId',
    });

    MiningAppPayout.App = MiningAppPayout.belongsTo(models.App, {
      foreignKey: 'appId',
    });
  };
  return MiningAppPayout;
};
