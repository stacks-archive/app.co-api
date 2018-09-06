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
  MiningReviewerReport.associate = function(models) {
    // associations can be defined here
  };
  return MiningReviewerReport;
};
