module.exports = (sequelize, DataTypes) => {
  const Ranking = sequelize.define(
    'Ranking',
    {
      appId: DataTypes.INTEGER,
      twitterMentions: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
      monthlyVisitsCount: DataTypes.FLOAT,
      monthlyBounceRate: DataTypes.FLOAT,
      monthlyPageViews: DataTypes.FLOAT,
      monthlyVisitDuration: DataTypes.FLOAT,
    },
    {},
  );

  Ranking.associate = function association(models) {
    Ranking.App = Ranking.belongsTo(models.App, { foreignKey: 'appId' });
  };

  return Ranking;
};
