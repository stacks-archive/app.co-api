module.exports = {
  up: (queryInterface, Sequelize) => {
    const opts = { tableName: 'MiningMonthlyReports' };
    if (process.env.SCHEMA_NAME) {
      opts.schema = process.env.SCHEMA_NAME;
    }
    queryInterface.addColumn(opts, 'stxPayoutTotal', Sequelize.INTEGER);
    queryInterface.addColumn(opts, 'stxPayoutDecay', Sequelize.FLOAT);
    queryInterface.addColumn(opts, 'stxPayoutConversionRate', Sequelize.FLOAT);
    queryInterface.addColumn(opts, 'stxPayoutIsIOU', Sequelize.BOOLEAN);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    const opts = { tableName: 'MiningMonthlyReports' };
    if (process.env.SCHEMA_NAME) {
      opts.schema = process.env.SCHEMA_NAME;
    }
    queryInterface.removeColumn(opts, 'stxPayoutTotal', Sequelize.INTEGER);
    queryInterface.removeColumn(opts, 'stxPayoutDecay', Sequelize.FLOAT);
    queryInterface.removeColumn(opts, 'stxPayoutConversionRate', Sequelize.FLOAT);
    queryInterface.removeColumn(opts, 'stxPayoutIsIOU', Sequelize.BOOLEAN);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
