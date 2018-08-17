const _ = require('lodash');
const uuid = require('uuid/v4');

const ENUMS = require('./constants/app-constants');
const { slugify } = require('../../common/lib/utils');

module.exports = (sequelize, DataTypes) => {
  const App = sequelize.define(
    'App',
    {
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      categoryID: DataTypes.INTEGER,
      website: DataTypes.STRING,
      blockchainID: DataTypes.INTEGER,
      storageNetworkID: DataTypes.INTEGER,
      authenticationID: DataTypes.INTEGER,
      openSourceUrl: DataTypes.STRING,
      registrationIsOpen: DataTypes.BOOLEAN,
      trackingIsBlocked: DataTypes.BOOLEAN,
      imageUrl: DataTypes.STRING,
      description: DataTypes.TEXT,
      twitterHandle: DataTypes.STRING,
      status: DataTypes.STRING,
      notes: DataTypes.TEXT,
      category: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.categoryIDToEnum[this.get('categoryID')];
        },
        set(value) {
          this.setDataValue('categoryID', ENUMS.categoryEnums[value]);
        },
      },
      blockchain: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.blockchainIDToEnum[this.get('blockchainID')];
        },
        set(value) {
          this.setDataValue('blockchainID', ENUMS.blockchainEnums[value]);
        },
      },
      storageNetwork: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.storageIDToEnum[this.get('storageNetworkID')];
        },
        set(value) {
          this.setDataValue('storageNetworkID', ENUMS.storageEnums[value]);
        },
      },
      authentication: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.authenticationIDToEnum[this.get('authenticationID')];
        },
        set(value) {
          this.setDataValue('authenticationID', ENUMS.authenticationEnums[value]);
        },
      },
    },
    {
      hooks: {
        afterCreate: async (app) => {
          const { Slug } = require('./index');
          const value = slugify(app.name.toLowerCase());
          await Slug.create({
            value,
            default: true,
            appId: app.id,
          });
        },
      },
    },
  );
  App.associate = function associations(models) {
    App.Rankings = App.hasMany(models.Ranking, {
      foreignKey: 'appId',
      onDelete: 'CASCADE',
    });

    App.Slugs = App.hasMany(models.Slug, {
      foreignKey: 'appId',
      onDelete: 'CASCADE',
    });

    App.findAllWithRankings = (isAdmin = false) => {
      const options = {
        include: [
          {
            model: models.Ranking,
            order: [['date', 'DESC']],
            limit: 1,
          },
          {
            model: models.Slug,
            order: [['default', 'DESC']],
          },
        ],
      };
      if (!isAdmin) {
        options.attributes = { exclude: ['status', 'notes'] };
        options.where = { status: 'accepted' };
      }
      return App.findAll(options);
    };
  };

  _.extend(App, ENUMS);

  App.prototype.setDefaultSlug = function setDefaultSlug() {
    const { Slug } = require('./');
    return new Promise(async (resolve, reject) => {
      const slugs = await Slug.findAll({ where: { appId: this.id } });
      if (slugs.length !== 0) {
        return resolve();
      }
      let value = slugify(this.name.toLowerCase());
      try {
        await Slug.create({
          value,
          default: true,
          appId: this.id,
        });
        return resolve();
      } catch (error) {
        console.log(`Duplicate slug found: ${value}. Adding random string.`);
        value += `-${uuid()}`;
        try {
          await Slug.create({
            value,
            default: true,
            appId: this.id,
          });
          return resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  };

  return App;
};
