import helpers from '../tests_helper';
import { App, Ranking, Slug } from '../../db/models';

it('can fetch from an empty state', async () => {
  const apps = await App.findAll();
  expect(apps.length).toBe(0);
});

it('requires name to be present', async () => {
  const app = await App.build({
    name: null,
  });

  expect(app.save).toThrow();
});

describe('enums', () => {
  it('uses enums for categories properly', async () => {
    const app = await App.create({
      name: 'MyApp',
      category: 'Social Networking',
    });

    expect(app.categoryID).toEqual(App.categoryEnums['Social Networking']);
    expect(app.categoryID).not.toBeNull();
    expect(app.category).toEqual('Social Networking');
    app.category = 'Health & Fitness';
    expect(app.categoryID).toEqual(App.categoryEnums['Health & Fitness']);
  });

  it('uses enums for blockchains properly', async () => {
    const app = await App.create({
      name: 'MyApp',
      blockchain: 'Ethereum',
    });

    expect(app.blockchainID).toEqual(App.blockchainEnums.Ethereum);
    expect(app.blockchainID).not.toBeNull();
    expect(app.blockchain).toEqual('Ethereum');
    app.blockchain = 'Bitcoin';
    expect(app.blockchainID).toEqual(App.blockchainEnums.Bitcoin);
  });

  it('uses enums for storage properly', async () => {
    const app = await App.create({
      name: 'MyApp',
      storageNetwork: 'Gaia',
    });

    expect(app.storageNetworkID).toEqual(App.storageEnums.Gaia);
    expect(app.storageNetworkID).not.toBeNull();
    expect(app.storageNetwork).toEqual('Gaia');
    app.storageNetwork = 'IPFS';
    expect(app.storageNetworkID).toEqual(App.storageEnums.IPFS);
  });

  it('uses enums for authentication properly', async () => {
    const app = await App.create({
      name: 'MyApp',
      authentication: 'Blockstack',
    });

    expect(app.authenticationID).toEqual(App.authenticationEnums.Blockstack);
    expect(app.authenticationID).not.toBeNull();
    expect(app.authentication).toEqual('Blockstack');
    app.authentication = 'Ethereum';
    expect(app.authenticationID).toEqual(App.authenticationEnums.Ethereum);
  });
});

describe('findWithRankings', () => {
  it('should return only the most recent rankings', async () => {
    const app = await helpers.makeApp();
    const now = new Date();

    const ranking = await Ranking.create({
      appId: app.id,
      date: now,
    });

    now.setDate(now.getDate() - 1);

    await Ranking.create({
      appId: app.id,
      date: now,
    });

    const apps = await App.findAllWithRankings();
    expect(apps[0].id).toEqual(app.id);
    expect(apps[0].Rankings[0].id).toEqual(ranking.id);
    expect(apps[0].Rankings.length).toEqual(1);
  });
});

it('should save an access token', async () => {
  const app = await App.create({ name: 'asdf' });
  expect(app.accessToken).not.toBeFalsy();
});

it('can make a slug if there is a duplicate', async () => {
  const name = 'tester';
  await helpers.makeApp(name);
  const app2 = await helpers.makeApp(name);
  const slug = await Slug.findOne({ where: { appId: app2.id } });
  expect(slug.value.startsWith(name)).toBeTruthy();
  expect(slug.value.length).toBeGreaterThan(name.length);
});
