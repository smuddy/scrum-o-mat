import {ID} from './id';

describe('ID', () => {

  it('returns a lowercase alphanumeric string of at most nine characters', () => {
    const id = ID();
    expect(typeof id).toBe('string');
    expect(id.length).toBeLessThanOrEqual(9);
    expect(id).toMatch(/^[a-z0-9]*$/);
  });

  it('derives the value from Math.random', () => {
    spyOn(Math, 'random').and.returnValue(0.5);
    expect(ID()).toBe('i');
  });

  it('produces different values for different random seeds', () => {
    const random = spyOn(Math, 'random');
    random.and.returnValue(0.123456789);
    const first = ID();
    random.and.returnValue(0.987654321);
    const second = ID();
    expect(first).not.toBe(second);
  });

});
