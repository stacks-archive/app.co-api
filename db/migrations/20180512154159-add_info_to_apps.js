module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Apps', 'imageUrl', {
      type: Sequelize.STRING,
    });
    queryInterface.addColumn('Apps', 'description', {
      type: Sequelize.TEXT,
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
