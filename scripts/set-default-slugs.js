const { slugify } = require('../common/lib/utils');
const { App, Slug } = require('../db/models');

const setSlug = (app) =>
  new Promise(async (resolve, reject) => {
    console.log('Setting slug for', app.name);
    const slugs = app.Slugs;
    if (slugs.length !== 0) {
      console.log('existing slug:', slugs[0].value);
      return resolve();
    }
    const value = slugify(app.name.toLowerCase());
    console.log('New slug:', value);
    try {
      const slug = await Slug.create({
        value,
        default: true,
        appId: app.id,
      });
      app.Slugs.push(slug);
      return resolve();
    } catch (error) {
      return reject(error);
    }
  });

const setDefaultSlugs = async () => {
  const apps = await App.findAllWithRankings();
  const updateFns = apps.map((app) => setSlug(app));
  await Promise.all(updateFns);
  console.log('Done');
  process.exit();
};

setDefaultSlugs();
