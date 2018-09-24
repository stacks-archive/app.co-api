module.exports = (sequelize, DataTypes) => {
  const MiningReviewerReport = sequelize.define(
    'MiningReviewerReport',
    {
      reportId: DataTypes.INTEGER,
      reviewerName: DataTypes.STRING,
      summary: DataTypes.TEXT,
    },
    {},
  );
  MiningReviewerReport.associate = function associate(models) {
    MiningReviewerReport.MiningReviewerRanking = MiningReviewerReport.hasMany(models.MiningReviewerRanking, {
      foreignKey: 'reviewerId',
      onDelete: 'CASCADE',
    });
  };
  return MiningReviewerReport;
};
