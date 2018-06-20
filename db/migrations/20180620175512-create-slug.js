module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('Slugs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      default: {
        type: Sequelize.BOOLEAN,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      appId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Apps',
          key: 'id',
          deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED,
        },
        allowNull: false,
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('Slugs'),
};
