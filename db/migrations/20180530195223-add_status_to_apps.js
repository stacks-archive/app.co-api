module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'accepted',
      allowNull: false,
    });
    queryInterface.addColumn('Apps', 'notes', {
      type: Sequelize.TEXT,
    });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => [
    queryInterface.removeColumn('Apps', 'status', {
      type: Sequelize.STRING,
    }),
    queryInterface.removeColumn('Apps', 'notes', {
      type: Sequelize.TEXT,
    }),
  ],
  /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
};
