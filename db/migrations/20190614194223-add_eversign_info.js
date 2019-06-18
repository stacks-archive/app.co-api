module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'eversignDocumentID', Sequelize.STRING);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Apps', 'eversignDocumentID', Sequelize.STRING);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
