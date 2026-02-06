import { BackupScheduler } from './BackupScheduler';
import { BACKUP_MANUAL_INTERVAL } from '../types/types';

vi.mock('../../../auth/handlers', () => ({
  getIsLoggedIn: vi.fn(() => true),
}));

vi.mock('../../../config', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
  },
}));

describe('BackupScheduler', () => {
  let mockTask: ReturnType<typeof vi.fn>;
  let mockLastBackup: ReturnType<typeof vi.fn>;
  let mockInterval: ReturnType<typeof vi.fn>;
  let scheduler: BackupScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockTask = vi.fn().mockResolvedValue(undefined);
    mockLastBackup = vi.fn();
    mockInterval = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Manual mode (interval = -1)', () => {
    it('should not schedule or run backups when interval is set to manual mode', async () => {
      mockInterval.mockReturnValue(BACKUP_MANUAL_INTERVAL);
      mockLastBackup.mockReturnValue(Date.now());
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(false);
    });

    it('should not schedule backups even if lastBackup is set to a valid timestamp', async () => {
      mockInterval.mockReturnValue(BACKUP_MANUAL_INTERVAL);
      mockLastBackup.mockReturnValue(Date.now() - 3600000); // 1 hour ago
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(false);
    });
  });

  describe('First-time backup (lastBackup = -1)', () => {
    it('should schedule backup for the full interval when never backed up before', async () => {
      mockLastBackup.mockReturnValue(BACKUP_MANUAL_INTERVAL); // -1 = never backed up
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      // Should NOT run immediately, but schedule for the interval
      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);
    });

    it('should run first backup after the full interval elapses', async () => {
      mockLastBackup.mockReturnValue(BACKUP_MANUAL_INTERVAL);
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(mockTask).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(3600000); // 1 hour

      expect(mockTask).toHaveBeenCalledTimes(1);
      expect(scheduler.isScheduled()).toBe(true);
    });
  });

  describe('Overdue backups', () => {
    it('should run backup immediately when next backup time is in the past', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 7200000); // 2 hours ago
      mockInterval.mockReturnValue(3600000); // 1 hour interval
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should calculate negative milliseconds for overdue backups', () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 7200000); // 2 hours ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      const milliseconds = scheduler.millisecondsToNextBackup();

      expect(milliseconds).toBeLessThan(0);
      expect(scheduler.shouldDoBackup()).toBe(true);
    });
  });

  describe('Regular scheduled backups', () => {
    it('should schedule backup for the future when not overdue', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour interval
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);
    });

    it('should run backup after the scheduled time elapses', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      await vi.advanceTimersByTimeAsync(1800000); // 30 minutes

      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should reschedule next backup after completing current backup', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 7200000); // 2 hours ago (overdue)
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(mockTask).toHaveBeenCalledTimes(1);
      expect(scheduler.isScheduled()).toBe(true);

      await vi.advanceTimersByTimeAsync(3600000);
      expect(mockTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('Time calculations', () => {
    it('should correctly calculate milliseconds to next backup', () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      const milliseconds = scheduler.millisecondsToNextBackup();

      expect(milliseconds).toBeGreaterThan(1790000);
      expect(milliseconds).toBeLessThan(1810000);
    });

    it('should return true for shouldDoBackup when time is negative or zero', () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 3600000); // 1 hour ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      expect(scheduler.shouldDoBackup()).toBe(true);
    });

    it('should return false for shouldDoBackup when next backup is in the future', () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      expect(scheduler.shouldDoBackup()).toBe(false);
    });
  });

  describe('Scheduler controls', () => {
    it('should stop scheduled backup when stop() is called', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(scheduler.isScheduled()).toBe(true);

      scheduler.stop();
      await vi.advanceTimersByTimeAsync(3600000);
      expect(mockTask).not.toHaveBeenCalled();
    });

    it('should restart scheduler when reschedule() is called', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 1800000); // 30 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      const wasScheduled = scheduler.isScheduled();

      scheduler.reschedule();

      expect(wasScheduled).toBe(true);
      expect(scheduler.isScheduled()).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle immediate backup (interval = 0)', async () => {
      mockLastBackup.mockReturnValue(Date.now());
      mockInterval.mockReturnValue(0); // Run immediately always
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should handle very short intervals (30 seconds)', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 60000); // 1 minute ago
      mockInterval.mockReturnValue(30000); // 30 seconds
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should handle very long intervals (24 hours)', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 12 * 3600000); // 12 hours ago
      mockInterval.mockReturnValue(24 * 3600000); // 24 hours
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);

      const milliseconds = scheduler.millisecondsToNextBackup();
      expect(milliseconds).toBeGreaterThan(11 * 3600000); // ~12 hours remaining
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle app restart with valid lastBackup and interval', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 600000); // 10 minutes ago
      mockInterval.mockReturnValue(3600000); // 1 hour
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      // Should schedule for 50 minutes from now
      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);

      const milliseconds = scheduler.millisecondsToNextBackup();
      expect(milliseconds).toBeGreaterThan(2900000); // ~50 minutes
      expect(milliseconds).toBeLessThanOrEqual(3000000);
    });

    it('should handle user changing interval from 24h to 1h', async () => {
      const now = Date.now();
      mockLastBackup.mockReturnValue(now - 30 * 60000); // 30 minutes ago
      mockInterval.mockReturnValue(24 * 3600000); // Initially 24h
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();
      expect(mockTask).not.toHaveBeenCalled();

      // User changes to 1 hour
      mockInterval.mockReturnValue(3600000);
      scheduler.reschedule();
      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);
    });

    it('should handle fresh installation flow', async () => {
      mockLastBackup.mockReturnValue(BACKUP_MANUAL_INTERVAL);
      mockInterval.mockReturnValue(3600000);
      scheduler = new BackupScheduler(mockLastBackup, mockInterval, mockTask);

      await scheduler.start();

      expect(mockTask).not.toHaveBeenCalled();
      expect(scheduler.isScheduled()).toBe(true);

      await vi.advanceTimersByTimeAsync(3600000);
      expect(mockTask).toHaveBeenCalledTimes(1);
    });
  });
});
