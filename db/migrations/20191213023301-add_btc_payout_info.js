module.exports = {
  up: (queryInterface, Sequelize) => {
    const opts = { tableName: 'MiningMonthlyReports' };
    if (process.env.SCHEMA_NAME) {
      opts.schema = process.env.SCHEMA_NAME;
    }
    queryInterface.addColumn(opts, 'btcPayoutTotal', { type: Sequelize.INTEGER, defaultValue: 100000 });
    queryInterface.addColumn(opts, 'btcPayoutDecay', { type: Sequelize.FLOAT, defaultValue: 0.2 });
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
