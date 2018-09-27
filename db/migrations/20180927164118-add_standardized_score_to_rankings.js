module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('MiningReviewerRankings', 'standardScore', { type: Sequelize.FLOAT });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('MiningReviewerRankings', 'finalStandardizedScore', { type: Sequelize.FLOAT });
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
