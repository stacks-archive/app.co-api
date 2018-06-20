module.exports = (sequelize, DataTypes) => {
  const Slug = sequelize.define(
    'Slug',
    {
      default: DataTypes.BOOLEAN,
      value: DataTypes.STRING,
      appId: DataTypes.INTEGER,
    },
    {},
  );
  Slug.associate = function associate(models) {
    Slug.App = Slug.belongsTo(models.App, { foreignKey: 'appId' });
  };
  return Slug;
};
