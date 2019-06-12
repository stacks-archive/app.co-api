module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'stacksAddress', Sequelize.STRING);
    queryInterface.addColumn('Apps', 'hasCollectedKYC', Sequelize.STRING);
    queryInterface.addColumn('Apps', 'hasAcceptedSECTerms', Sequelize.STRING);
    queryInterface.addColumn('Apps', 'hasAcceptedTerms', Sequelize.STRING);
    queryInterface.addIndex('Apps', { fields: ['status'] });
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
