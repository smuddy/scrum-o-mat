import {describe, it, expect, afterEach, vi} from 'vitest';

import {ID} from './id';

describe('ID', () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a lowercase alphanumeric string of at most nine characters', () => {
    const id = ID();
    expect(typeof id).toBe('string');
    expect(id.length).toBeLessThanOrEqual(9);
    expect(id).toMatch(/^[a-z0-9]*$/);
  });

  it('derives the value from Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(ID()).toBe('i');
  });

  it('produces different values for different random seeds', () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0.123456789);
    const first = ID();
    random.mockReturnValue(0.987654321);
    const second = ID();
    expect(first).not.toBe(second);
  });

});
