import {
  dynamicWeightedMovingAverage,
  exponentialMovingAverage,
  simpleMovingAverage,
  smoothedMovingAverage,
  weightedMovingAverage,
} from './moving-average-helper';

describe('moving-average-helper', () => {

  describe('simpleMovingAverage', () => {
    it('returns the arithmetic mean when the size is falsy', () => {
      expect(simpleMovingAverage([2, 4, 6], 0)).toBe(4);
    });

    it('returns a copy of the data when size is less or equal to one', () => {
      const data = [1, 2, 3];
      const result = simpleMovingAverage(data, 1);
      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toBe(data);
    });

    it('returns an empty array of the data length when size exceeds the data length', () => {
      const result = simpleMovingAverage([1, 2], 5);
      expect(result.length).toBe(2);
      expect(result[0]).toBeUndefined();
    });

    it('averages over a sliding window of the given size', () => {
      const result = simpleMovingAverage([1, 2, 3, 4, 5], 2);
      expect(result[0]).toBeUndefined();
      expect(result[1]).toBeCloseTo(1.5);
      expect(result[2]).toBeCloseTo(2.5);
      expect(result[3]).toBeCloseTo(3.5);
      expect(result[4]).toBeCloseTo(4.5);
    });

    it('averages over a window of size three', () => {
      const result = simpleMovingAverage([1, 2, 3, 4, 5], 3);
      expect(result[2]).toBeCloseTo(2);
      expect(result[3]).toBeCloseTo(3);
      expect(result[4]).toBeCloseTo(4);
    });
  });

  describe('dynamicWeightedMovingAverage', () => {
    it('returns an empty array of the data length when alpha is greater than one', () => {
      const result = dynamicWeightedMovingAverage([1, 2, 3], 2);
      expect(result.length).toBe(3);
      expect(result[0]).toBeUndefined();
    });

    it('returns a copy of the data when alpha equals one', () => {
      const data = [1, 2, 3];
      const result = dynamicWeightedMovingAverage(data, 1);
      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toBe(data);
    });

    it('applies a fixed alpha weighting starting from the first value', () => {
      const result = dynamicWeightedMovingAverage([1, 2, 3], 0.5);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(1.5);
      expect(result[2]).toBeCloseTo(2.25);
    });

    it('starts with zero when the head is suppressed', () => {
      const result = dynamicWeightedMovingAverage([1, 2, 3], 0.5, true);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(1.5);
      expect(result[2]).toBeCloseTo(2.25);
    });
  });

  describe('exponentialMovingAverage', () => {
    it('uses an alpha derived from the size', () => {
      const result = exponentialMovingAverage([1, 2, 3], 3);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(1.5);
      expect(result[2]).toBeCloseTo(2.25);
    });
  });

  describe('smoothedMovingAverage', () => {
    it('suppresses the head and smooths with alpha times over size', () => {
      const result = smoothedMovingAverage([1, 2, 3], 2);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(1.5);
      expect(result[2]).toBeCloseTo(2.25);
    });
  });

  describe('weightedMovingAverage', () => {
    it('returns a copy of the data when size is less or equal to one', () => {
      const data = [1, 2, 3];
      const result = weightedMovingAverage(data, 1);
      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toBe(data);
    });

    it('returns an empty array of the data length when size exceeds the data length', () => {
      const result = weightedMovingAverage([1, 2], 5);
      expect(result.length).toBe(2);
      expect(result[0]).toBeUndefined();
    });

    it('weights recent values higher within the window', () => {
      const result = weightedMovingAverage([1, 2, 3, 4, 5], 2);
      expect(result[0]).toBeUndefined();
      expect(result[1]).toBeCloseTo(5 / 3);
      expect(result[2]).toBeCloseTo(8 / 3);
      expect(result[3]).toBeCloseTo(11 / 3);
      expect(result[4]).toBeCloseTo(14 / 3);
    });
  });

});
