module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('MiningMonthlyReports', 'purchaseExchangeName', { type: Sequelize.STRING });
    queryInterface.addColumn('MiningMonthlyReports', 'purchasedAt', { type: Sequelize.DATE });
    queryInterface.addColumn('MiningMonthlyReports', 'purchaseConversionRate', { type: Sequelize.FLOAT });
    queryInterface.addColumn('MiningMonthlyReports', 'BTCTransactionId', { type: Sequelize.STRING });
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
