// import helpers from '../tests_helper';
import { MiningMonthlyReport } from '../../db/models';

it('must have a date', async () => {
  const report = new MiningMonthlyReport();
  expect(report.save).toThrow();
});

it('works with valid details', async () => {
  const report = new MiningMonthlyReport({
    month: 2,
    year: 2018,
  });
  await report.save();
  expect(report.id).not.toBeNull();
  // report = await MiningMonthlyReport.findByPk(report.id);
  // expect(report.status).toEqual('pending');
});

it('cant make a duplicate report for the same month', async () => {
  const report = new MiningMonthlyReport({
    month: 2,
    year: 2018,
  });
  await report.save();

  const report2 = new MiningMonthlyReport({
    month: 2,
    year: 2018,
  });
  expect(report2.save).toThrow();
});
