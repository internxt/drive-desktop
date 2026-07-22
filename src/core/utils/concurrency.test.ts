import { getWorkerCount } from './concurrency';

describe('concurrency', () => {
  describe('getWorkerCount', () => {
    it('should return item count when there are fewer items than concurrency', () => {
      expect(getWorkerCount({ concurrency: 20, itemCount: 5 })).toBe(5);
    });

    it('should return concurrency when there are more items than concurrency', () => {
      expect(getWorkerCount({ concurrency: 20, itemCount: 100 })).toBe(20);
    });

    it('should return zero when there are no items', () => {
      expect(getWorkerCount({ concurrency: 20, itemCount: 0 })).toBe(0);
    });
  });
});
