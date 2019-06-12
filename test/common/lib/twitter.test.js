import helpers from '../../tests_helper';
import { paginateMentions, saveRanking } from '../../../common/lib/twitter';
import { Ranking } from '../../../db/models';

test.skip('fetches the total number of mentions for an app', async () => {
  const app = await helpers.makeApp();

  const totalMentions = await paginateMentions(app);
  expect(totalMentions).toBeGreaterThan(100);
});

test.skip('saves a ranking model for an app', async () => {
  const app = await helpers.makeApp();

  const ranking = await saveRanking(app);
  expect(ranking.appId).toEqual(app.id);
  expect(ranking.twitterMentions).not.toBeNull();
  expect(ranking.twitterMentions).toBeGreaterThan(0);
});

test.skip('it should override the current ranking', async () => {
  const app = await helpers.makeApp();

  const ranking = await Ranking.create({
    appId: app.id,
    date: new Date(),
    twitterMentions: 1,
  });

  const result = await saveRanking(app);
  expect(result.id).toEqual(ranking.id);
  expect(result.twitterMentions).toBeGreaterThan(1);
});
