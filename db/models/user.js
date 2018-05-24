module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      blockstackDID: DataTypes.STRING,
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      blockstackUsername: DataTypes.STRING,
    },
    {},
  );
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
