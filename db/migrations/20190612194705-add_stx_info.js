module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'stacksAddress', Sequelize.STRING);
    queryInterface.addColumn('Apps', 'hasCollectedKYC', Sequelize.BOOLEAN);
    queryInterface.addColumn('Apps', 'hasAcceptedSECTerms', Sequelize.BOOLEAN);
    queryInterface.addColumn('Apps', 'hasAcceptedTerms', Sequelize.BOOLEAN);
    queryInterface.addIndex('Apps', { fields: ['status'], name: 'Appsstatus' });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Apps', 'stacksAddress', Sequelize.STRING);
    queryInterface.removeColumn('Apps', 'hasCollectedKYC', Sequelize.BOOLEAN);
    queryInterface.removeColumn('Apps', 'hasAcceptedSECTerms', Sequelize.BOOLEAN);
    queryInterface.removeColumn('Apps', 'hasAcceptedTerms', Sequelize.BOOLEAN);
    queryInterface.removeIndex('Apps', 'Appsstatus');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
