module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('MiningMonthlyReports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'uniqueByMonthYear',
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'uniqueByMonthYear',
      },
      status: {
        type: Sequelize.STRING,
        default: 'pending',
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('MiningMonthlyReports'),
};
