module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Rankings', 'monthlyVisitsCount', {
      type: Sequelize.FLOAT,
    });
    queryInterface.addColumn('Rankings', 'monthlyBounceRate', {
      type: Sequelize.FLOAT,
    });
    queryInterface.addColumn('Rankings', 'monthlyPageViews', {
      type: Sequelize.FLOAT,
    });
    queryInterface.addColumn('Rankings', 'monthlyVisitDuration', {
      type: Sequelize.FLOAT,
    });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
