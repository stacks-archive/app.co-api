module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'isSubmittingOwnApp', { type: Sequelize.BOOLEAN, defaultValue: false });
    queryInterface.addColumn('Apps', 'submitterName', { type: Sequelize.STRING });
    queryInterface.addColumn('Apps', 'referralSource', { type: Sequelize.STRING });
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
