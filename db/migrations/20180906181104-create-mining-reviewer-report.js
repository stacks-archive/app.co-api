module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('MiningReviewerReports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reportId: {
        type: Sequelize.INTEGER,
      },
      reviewerName: {
        type: Sequelize.STRING,
      },
      summary: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('MiningReviewerReports'),
};
