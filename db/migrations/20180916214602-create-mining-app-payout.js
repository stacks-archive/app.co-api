module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('MiningAppPayouts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reportId: {
        type: Sequelize.INTEGER,
      },
      appId: {
        type: Sequelize.INTEGER,
      },
      BTCPaymentValue: {
        type: Sequelize.INTEGER,
      },
      rank: {
        type: Sequelize.INTEGER,
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('MiningAppPayouts'),
};
