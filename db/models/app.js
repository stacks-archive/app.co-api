const _ = require('lodash');
const uuid = require('uuid/v4');

const ENUMS = require('./constants/app-constants');
const { slugify } = require('../../common/lib/utils');
const { uploadFromURL } = require('../../common/lib/gcloud');

const getEnumOrNull = (enums, value) => {
  const id = enums[value];
  if (typeof id === 'undefined') {
    return null;
  }
  return id;
};

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
      description: DataTypes.TEXT,
      twitterHandle: DataTypes.STRING,
      status: DataTypes.STRING,
      notes: DataTypes.TEXT,
      gcsImagePath: DataTypes.STRING,
      isKYCVerified: DataTypes.BOOLEAN,
      BTCAddress: DataTypes.STRING,
      contactEmail: DataTypes.STRING,
      submitterName: DataTypes.STRING,
      referralSource: DataTypes.STRING,
      isSubmittingOwnApp: DataTypes.BOOLEAN,
      productionId: DataTypes.INTEGER,
      referralCode: DataTypes.STRING,
      refSource: DataTypes.STRING,
      stacksAddress: DataTypes.STRING,
      hasCollectedKYC: DataTypes.BOOLEAN,
      hasAcceptedSECTerms: DataTypes.BOOLEAN,
      hasAcceptedTerms: DataTypes.BOOLEAN,
      accessToken: DataTypes.STRING,
      eversignDocumentID: DataTypes.STRING,
      jumioTransactionID: DataTypes.STRING,
      jumioEmbedURL: DataTypes.STRING,
      imageUrl: {
        type: DataTypes.STRING,
      },
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
          this.setDataValue('blockchainID', getEnumOrNull(ENUMS.blockchainEnums, value));
        },
      },
      storageNetwork: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.storageIDToEnum[this.get('storageNetworkID')];
        },
        set(value) {
          this.setDataValue('storageNetworkID', getEnumOrNull(ENUMS.storageEnums, value));
        },
      },
      authentication: {
        type: DataTypes.VIRTUAL,
        get() {
          return ENUMS.authenticationIDToEnum[this.get('authenticationID')];
        },
        set(value) {
          this.setDataValue('authenticationID', getEnumOrNull(ENUMS.authenticationEnums, value));
        },
      },
      imgixImageUrl: {
        type: DataTypes.VIRTUAL,
        get() {
          const { gcsImagePath } = this;
          if (gcsImagePath) {
            return `https://appco.imgix.net/${gcsImagePath.slice(7)}`;
          }
          return null;
        },
      },
    },
    {
      hooks: {
        afterCreate: async (app) => {
          // const { Slug } = require('./index');
          // const value = slugify(app.name.toLowerCase());
          // await Slug.create({
          //   value,
          //   default: true,
          //   appId: app.id,
          // });
          await app.setDefaultSlug();
        },
        beforeSave: async (app) => {
          const { imageUrl } = app;
          const previous = app.previous('imageUrl');
          if (imageUrl !== previous) {
            await app.uploadToGCS({ save: false });
          }
          if (!app.accessToken) {
            app.accessToken = uuid();
          }
          return true;
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

    App.includeOptions = {
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

    App.privateColumns = [
      'status',
      'notes',
      'isKYCVerified',
      'BTCAddress',
      'contactEmail',
      'refSource',
      'referralCode',
      'referralSource',
      'submitterName',
      'stacksAddress',
      'hasCollectedKYC',
      'hasAcceptedSECTerms',
      'hasAcceptedTerms',
      'accessToken',
      'eversignDocumentID',
      'jumioTransactionID',
      'jumioEmbedURL',
    ];

    App.findAllWithRankings = (isAdmin = false) => {
      const options = _.cloneDeep(App.includeOptions);
      if (!isAdmin) {
        options.attributes = { exclude: App.privateColumns };
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
        } catch (err2) {
          reject(err2);
        }
      }
    });
  };

  App.prototype.uploadToGCS = function uploadToGCS({ save = true }) {
    return new Promise(async (resolve, reject) => {
      try {
        const { imageUrl } = this;
        if (imageUrl && imageUrl.length !== 0) {
          console.log(`Uploading image for ${this.name}`);
          // console.log(this.gcsImagePath);
          const file = await uploadFromURL(imageUrl);
          if (!file) {
            return resolve();
          }
          this.gcsImagePath = file.name;
          if (save) {
            await this.save();
          }
          // console.log(this.name, this.imgixImageUrl);
          return resolve();
        }
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });
  };

  return App;
};
