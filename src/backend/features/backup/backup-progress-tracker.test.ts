import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupProgressTracker } from './backup-progress-tracker';
import { broadcastToWindows } from '../../../apps/main/windows';

vi.mock('../../../apps/main/windows', () => ({
  broadcastToWindows: vi.fn(),
}));

describe('BackupProgressTracker', () => {
  let tracker: BackupProgressTracker;

  beforeEach(() => {
    tracker = new BackupProgressTracker();
    vi.clearAllMocks();
  });

  describe('addToTotal', () => {
    it('should add to total items given a number', () => {
      tracker.addToTotal(5);

      expect(tracker.getPercentage()).toBe(0);
    });

    it('should accumulate total items when called multiple times', () => {
      tracker.addToTotal(5);
      tracker.addToTotal(10);
      tracker.incrementProcessed(15);

      expect(tracker.getPercentage()).toBe(100);
    });

    it('should handle adding zero to total items', () => {
      tracker.addToTotal(0);

      expect(tracker.getPercentage()).toBe(0);
    });

    it('should handle adding negative numbers to total items', () => {
      tracker.addToTotal(10);
      tracker.addToTotal(-5);
      tracker.incrementProcessed(5);

      expect(tracker.getPercentage()).toBe(100);
    });
  });

  describe('reset', () => {
    it('should reset processed and total items to zero', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(50);

      tracker.reset();

      expect(tracker.getPercentage()).toBe(0);
    });
  });

  describe('incrementProcessed', () => {
    it('should increment processed items given a number', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(25);

      expect(tracker.getPercentage()).toBe(25);
    });

    it('should accumulate processed items when called multiple times', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(10);
      tracker.incrementProcessed(20);
      tracker.incrementProcessed(30);

      expect(tracker.getPercentage()).toBe(60);
    });

    it('should handle incrementing by zero', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(50);
      tracker.incrementProcessed(0);

      expect(tracker.getPercentage()).toBe(50);
    });

    it('should handle incrementing by negative numbers', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(50);
      tracker.incrementProcessed(-10);

      expect(tracker.getPercentage()).toBe(40);
    });

    it('should emit progress after incrementing processed items', () => {
      tracker.addToTotal(100);
      tracker.incrementProcessed(50);

      expect(broadcastToWindows).toHaveBeenCalledWith('backup-progress', 50);
    });
  });

  describe('getPercentage', () => {
    it('should return 0% when total items is zero', () => {
      expect(tracker.getPercentage()).toBe(0);
    });

    it('should return correct percentage based on processed and total items', () => {
      tracker.addToTotal(200);
      tracker.incrementProcessed(50);

      expect(tracker.getPercentage()).toBe(25);
    });

    it('should return 100% when processed items equal total items', () => {
      tracker.addToTotal(50);
      tracker.incrementProcessed(50);

      expect(tracker.getPercentage()).toBe(100);
    });

    it('should not exceed 100% even if processed items exceed total items', () => {
      tracker.addToTotal(50);
      tracker.incrementProcessed(100);

      expect(tracker.getPercentage()).toBe(100);
    });

    it('should round percentage to nearest integer', () => {
      tracker.addToTotal(3);
      tracker.incrementProcessed(1);

      expect(tracker.getPercentage()).toBe(33);
    });
  });
});
