module.exports = (sequelize, DataTypes) => {
  const MiningReviewerRanking = sequelize.define(
    'MiningReviewerRanking',
    {
      reportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uniqueByRankingAppReviewerReport',
      },
      reviewerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uniqueByRankingAppReviewerReport',
      },
      appId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uniqueByRankingAppReviewerReport',
      },
      ranking: {
        type: DataTypes.INTEGER,
      },
      standardScore: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {},
  );
  MiningReviewerRanking.associate = function associate(models) {
    MiningReviewerRanking.App = MiningReviewerRanking.belongsTo(models.App, { foreignKey: 'appId' });
    MiningReviewerRanking.MiningMonthlyReport = MiningReviewerRanking.belongsTo(models.MiningMonthlyReport, {
      foreignKey: 'reportId',
    });
    MiningReviewerRanking.MiningReviewerReport = MiningReviewerRanking.belongsTo(models.MiningReviewerReport, {
      foreignKey: 'reviewerId',
    });
  };
  return MiningReviewerRanking;
};
