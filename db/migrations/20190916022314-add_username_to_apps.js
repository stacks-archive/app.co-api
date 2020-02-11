module.exports = {
  up: (queryInterface, Sequelize) => {
    const opts = { tableName: 'Apps' };
    if (process.env.SCHEMA_NAME) {
      opts.schema = process.env.SCHEMA_NAME;
    }
    queryInterface.addColumn(opts, 'adminBlockstackID', Sequelize.STRING);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    const opts = { tableName: 'Apps' };
    if (process.env.SCHEMA_NAME) {
      opts.schema = process.env.SCHEMA_NAME;
    }
    queryInterface.removeColumn(opts, 'adminBlockstackID', Sequelize.STRING);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
