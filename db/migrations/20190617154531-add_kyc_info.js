module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'jumioTransactionID', Sequelize.STRING);
    queryInterface.addColumn('Apps', 'jumioEmbedURL', Sequelize.TEXT);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Apps', 'jumioTransactionID', Sequelize.STRING);
    queryInterface.removeColumn('Apps', 'jumioEmbedURL', Sequelize.STRING);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
