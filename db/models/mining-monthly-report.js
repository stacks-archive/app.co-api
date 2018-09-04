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
    },
    {},
  );
  MiningMonthlyReport.associate = function(models) {
    // associations can be defined here
  };
  return MiningMonthlyReport;
};
