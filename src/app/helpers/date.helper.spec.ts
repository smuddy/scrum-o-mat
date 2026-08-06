import {describe, it, expect} from 'vitest';

import {ISO8601WeekNuber} from './date.helper';

describe('ISO8601WeekNuber', () => {

  it('returns week 1 for the first Monday-based ISO week of the year', () => {
    expect(ISO8601WeekNuber(new Date(2021, 0, 4))).toBe(1);
  });

  it('returns week 53 for the last week of a 53-week year', () => {
    expect(ISO8601WeekNuber(new Date(2020, 11, 31))).toBe(53);
  });

  it('assigns early January days to the previous year last week', () => {
    expect(ISO8601WeekNuber(new Date(2021, 0, 1))).toBe(53);
  });

  it('assigns late December days to the next year first week', () => {
    expect(ISO8601WeekNuber(new Date(2019, 11, 30))).toBe(1);
  });

});
