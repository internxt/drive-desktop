import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAntivirusManager } from './antivirus-manager';
import { AntivirusClamAV } from './antivirus-clam-av';
import { AntivirusWindowsDefender } from './antivirus-windows-defender';
import { isWindowsDefenderRealTimeProtectionActive } from '../ipcs/ipcMainAntivirus';
import { initializeClamAV, clearAntivirus } from './utils/initializeAntivirus';
import { checkClamdAvailability } from './ClamAVDaemon';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

// Mock dependencies
vi.mock('./AntivirusClamAV', () => ({
  AntivirusClamAV: {
    createInstance: vi.fn(),
  },
}));

vi.mock('./AntivirusWindowsDefender', () => ({
  AntivirusWindowsDefender: {
    createInstance: vi.fn(),
  },
}));

vi.mock('../ipcs/ipcMainAntivirus', () => ({
  isWindowsDefenderRealTimeProtectionActive: vi.fn(),
}));

vi.mock('./utils/initializeAntivirus', () => ({
  initializeClamAV: vi.fn(),
  clearAntivirus: vi.fn(),
}));

vi.mock('./ClamAVDaemon', () => ({
  checkClamdAvailability: vi.fn(),
}));

vi.mock('@/apps/main/util', () => ({
  sleep: vi.fn(),
}));

vi.mock('@/apps/shared/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Define interfaces for mock instances compatible with Vitest
interface MockAntivirusInstance {
  initialize: ReturnType<typeof vi.fn>;
  scanFile: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

// Global mock instances
let mockClamAVInstance: MockAntivirusInstance;
let mockWindowsDefenderInstance: MockAntivirusInstance;
const mockLogger = logger;

beforeEach(() => {
  vi.clearAllMocks();

  // Reset singleton instance
  (getAntivirusManager() as unknown as { constructor: { instance: MockAntivirusInstance | null } }).constructor.instance = null;

  // Create fresh mock instances
  mockClamAVInstance = {
    initialize: vi.fn(),
    scanFile: vi.fn(),
    stop: vi.fn(),
  };

  mockWindowsDefenderInstance = {
    initialize: vi.fn(),
    scanFile: vi.fn(),
    stop: vi.fn(),
  };

  // Mock static methods
  (AntivirusClamAV.createInstance as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClamAVInstance);
  (AntivirusWindowsDefender.createInstance as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockWindowsDefenderInstance);

  // Default mock behavior
  (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (initializeClamAV as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (clearAntivirus as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (sleep as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AntivirusManager', () => {
  // Adjust access to private methods for testing
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton instance
    (getAntivirusManager() as unknown as { constructor: { instance: MockAntivirusInstance | null } }).constructor.instance = null;

    // Mock antivirus instances
    mockClamAVInstance = {
      initialize: vi.fn(),
      scanFile: vi.fn(),
      stop: vi.fn(),
    };

    mockWindowsDefenderInstance = {
      initialize: vi.fn(),
      scanFile: vi.fn(),
      stop: vi.fn(),
    };

    // Mock static methods
    (AntivirusClamAV.createInstance as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue(mockClamAVInstance);
    (AntivirusWindowsDefender.createInstance as unknown as ReturnType<typeof vi.fn>) = vi
      .fn()
      .mockResolvedValue(mockWindowsDefenderInstance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      // Verifies that the AntivirusManager follows the singleton pattern
      // and returns the same instance across multiple calls.
      const manager1 = getAntivirusManager();
      const manager2 = getAntivirusManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('selectAntivirusEngine', () => {
    it('should select Windows Defender when available', async () => {
      // Tests the selection of Windows Defender as the primary antivirus engine
      // when its real-time protection is active.

      // Configure mocks
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const manager = getAntivirusManager();

      const result = await (manager as unknown as { selectAntivirusEngine: () => Promise<string | null> }).selectAntivirusEngine();

      // Assert the expected behavior
      expect(result).toBe('windows-defender');
      expect(mockLogger.info).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'Windows Defender selected as primary antivirus',
      });

      // Verify the mock was called
      expect(isWindowsDefenderRealTimeProtectionActive).toHaveBeenCalled();
    });

    it('should select ClamAV when Windows Defender is not available', async () => {
      // Tests the fallback mechanism to select ClamAV as the antivirus engine
      // when Windows Defender is not available.

      // Configure mocks
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const manager = getAntivirusManager();

      const result = await (manager as unknown as { selectAntivirusEngine: () => Promise<string | null> }).selectAntivirusEngine();

      expect(result).toBe('clamav');
      expect(mockLogger.info).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'ClamAV selected as fallback antivirus',
      });
    });

    it('should initialize ClamAV when not available initially', async () => {
      // Tests the initialization process of ClamAV when it is not available
      // during the first check but becomes available after initialization.

      // Configure mocks
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      (initializeClamAV as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const manager = getAntivirusManager();

      const result = await (manager as unknown as { selectAntivirusEngine: () => Promise<string | null> }).selectAntivirusEngine();

      // Assert the expected behavior
      expect(initializeClamAV).toHaveBeenCalledOnce();
      expect(sleep).toHaveBeenCalledWith(5000);
      expect(result).toBe('clamav');
    });

    it('should return null when no antivirus engines are available', async () => {
      // Tests the behavior when no antivirus engines are available,
      // ensuring the system returns null and logs a warning.

      // Configure mocks
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const manager = getAntivirusManager();

      const result = await (manager as unknown as { selectAntivirusEngine: () => Promise<string | null> }).selectAntivirusEngine();

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'No antivirus engines available',
      });
    });
  });

  describe('createEngine', () => {
    it('should create Windows Defender engine', async () => {
      // Verifies the creation of a Windows Defender antivirus engine.
      const manager = getAntivirusManager();

      const result = await (manager as unknown as { createEngine: (type: string) => Promise<MockAntivirusInstance | null> }).createEngine(
        'windows-defender',
      );

      expect(result).toEqual(mockWindowsDefenderInstance); // Cambiar de .toBe a .toEqual
      expect(AntivirusWindowsDefender.createInstance).toHaveBeenCalledOnce();
    });

    it('should create ClamAV engine', async () => {
      // Verifies the creation of a ClamAV antivirus engine.
      const manager = getAntivirusManager();

      const result = await (manager as unknown as { createEngine: (type: string) => Promise<MockAntivirusInstance | null> }).createEngine(
        'clamav',
      );

      expect(result).toEqual(mockClamAVInstance); // Cambiar de .toBe a .toEqual
      expect(AntivirusClamAV.createInstance).toHaveBeenCalledOnce();
    });

    it('should fallback to ClamAV when Windows Defender fails', async () => {
      // Tests the fallback mechanism to ClamAV when the creation of
      // a Windows Defender engine fails.
      (AntivirusWindowsDefender.createInstance as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Windows Defender failed'),
      );
      const manager = getAntivirusManager();

      const result = await (manager as unknown as { createEngine: (type: string) => Promise<MockAntivirusInstance | null> }).createEngine(
        'windows-defender',
      );

      expect(result).toEqual(mockClamAVInstance); // Cambiar de .toBe a .toEqual
      expect(AntivirusClamAV.createInstance).toHaveBeenCalledOnce();
      expect(mockLogger.error).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'Error initializing Windows Defender, falling back to ClamAV',
        exc: expect.any(Error),
      });
    });

    it('should throw error for unsupported antivirus type', async () => {
      // Ensures an error is thrown when an unsupported antivirus type is requested.
      const manager = getAntivirusManager();

      await expect(
        (manager as unknown as { createEngine: (type: string) => Promise<MockAntivirusInstance | null> }).createEngine('unsupported'),
      ).rejects.toThrow('Unsupported antivirus type: unsupported');
    });
  });

  describe('getActiveEngine', () => {
    it('should return existing engine when it matches selected type', async () => {
      // Verifies that the active engine is returned when it matches
      // the selected antivirus type.

      // Reset counts and configure mocks
      vi.clearAllMocks();
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const manager = getAntivirusManager();

      // First call to set up engine
      const firstEngine = await manager.getActiveEngine();

      // Get the call count after first call
      const initialCallCount = (AntivirusWindowsDefender.createInstance as ReturnType<typeof vi.fn>).mock.calls.length;

      // Configure mocks for second call
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      // Act - Second call should return same engine
      const secondEngine = await manager.getActiveEngine();

      // Assert - use toEqual instead of toBe for object comparison
      expect(secondEngine).toEqual(firstEngine);
      // No additional calls should have been made
      expect((AntivirusWindowsDefender.createInstance as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCallCount);
    });

    it('should switch engines when preferred engine changes', async () => {
      // Tests the behavior when the preferred antivirus engine changes,
      // ensuring the system switches engines and stops the previous one.

      // First call - Windows Defender available
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const manager = getAntivirusManager();
      const firstEngine = await manager.getActiveEngine();

      // Reset and update mocks for second call
      vi.clearAllMocks();
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      // Second call - Windows Defender not available, ClamAV available
      const secondEngine = await manager.getActiveEngine();

      // Assert using toEqual instead of toBe
      expect(firstEngine).toEqual(mockWindowsDefenderInstance);
      expect(secondEngine).toEqual(mockClamAVInstance);
      expect(mockWindowsDefenderInstance.stop).toHaveBeenCalledOnce();
      expect(mockLogger.info).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'Antivirus engine switched to: clamav',
      });
    });

    it('should clean up ClamAV when switching away from it', async () => {
      // Verifies that ClamAV is properly cleaned up when switching
      // to another antivirus engine.

      // Configure mocks for first call - ClamAV
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const manager = getAntivirusManager();
      await manager.getActiveEngine();

      // Reset and update mocks for second call - Windows Defender
      vi.clearAllMocks();
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await manager.getActiveEngine();

      // Assert
      expect(mockClamAVInstance.stop).toHaveBeenCalledOnce();
      expect(clearAntivirus).toHaveBeenCalledOnce();
    });

    it('should return null and clean up when no engines are available', async () => {
      // Tests the behavior when no antivirus engines are available,
      // ensuring the system cleans up and returns null.

      // First call - Windows Defender available
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const manager = getAntivirusManager();
      await manager.getActiveEngine();

      // Reset and update mocks for second call - no engines
      vi.clearAllMocks();
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await manager.getActiveEngine();

      // Assert
      expect(result).toBeNull();
      expect(mockWindowsDefenderInstance.stop).toHaveBeenCalledOnce();
    });

    it('should handle errors gracefully and return null', async () => {
      // Ensures the system handles errors gracefully when checking
      // the availability of antivirus engines.
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Check failed'));
      const manager = getAntivirusManager();

      // Act
      const result = await manager.getActiveEngine();

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'Error getting active antivirus engine',
        exc: expect.any(Error),
      });
    });

    it('should handle engine creation errors gracefully', async () => {
      // Tests the behavior when errors occur during the creation
      // of antivirus engines, ensuring the system handles them gracefully.
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (AntivirusWindowsDefender.createInstance as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Creation failed'));
      (AntivirusClamAV.createInstance as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ClamAV creation failed'));
      const manager = getAntivirusManager();

      // Act
      const result = await manager.getActiveEngine();

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith({
        tag: 'ANTIVIRUS',
        msg: 'Error getting active antivirus engine',
        exc: expect.any(Error),
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow from Windows Defender to ClamAV', async () => {
      // Simulates a complete workflow where the system switches
      // between Windows Defender and ClamAV engines multiple times.

      // Reset all mocks before we start
      vi.clearAllMocks();

      // Create fresh mock instances for this test
      const localMockWindowsDefenderInstance = {
        initialize: vi.fn(),
        scanFile: vi.fn(),
        stop: vi.fn(),
      };

      const localMockClamAVInstance = {
        initialize: vi.fn(),
        scanFile: vi.fn(),
        stop: vi.fn(),
      };

      // Set up mock return values
      (AntivirusWindowsDefender.createInstance as ReturnType<typeof vi.fn>).mockResolvedValue(localMockWindowsDefenderInstance);
      (AntivirusClamAV.createInstance as ReturnType<typeof vi.fn>).mockResolvedValue(localMockClamAVInstance);

      // Create a fresh manager to avoid state from other tests
      (getAntivirusManager() as unknown as { constructor: { instance: null } }).constructor.instance = null;
      const manager = getAntivirusManager();

      // Start with Windows Defender
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const engine1 = await manager.getActiveEngine();

      // Switch to ClamAV
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      const engine2 = await manager.getActiveEngine();

      // Switch back to Windows Defender
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const engine3 = await manager.getActiveEngine();

      // Assert using toEqual
      expect(engine1).toEqual(localMockWindowsDefenderInstance);
      expect(engine2).toEqual(localMockClamAVInstance);
      expect(engine3).toEqual(localMockWindowsDefenderInstance);

      // Verify engines were stopped when switching
      expect(localMockWindowsDefenderInstance.stop).toHaveBeenCalled();
      expect(localMockClamAVInstance.stop).toHaveBeenCalled();
      expect(clearAntivirus).toHaveBeenCalled();
    });

    it('should maintain consistent state when same engine is requested', async () => {
      // Verifies that the system maintains a consistent state
      // when the same antivirus engine is requested multiple times.

      // Reset all mocks before we start
      vi.clearAllMocks();

      // Create fresh mock instances for this test
      const localMockWindowsDefenderInstance = {
        initialize: vi.fn(),
        scanFile: vi.fn(),
        stop: vi.fn(),
      };

      // Set up mock return value
      (AntivirusWindowsDefender.createInstance as ReturnType<typeof vi.fn>).mockResolvedValue(localMockWindowsDefenderInstance);

      // Create a fresh manager to avoid state from other tests
      (getAntivirusManager() as unknown as { constructor: { instance: null } }).constructor.instance = null;
      const manager = getAntivirusManager();

      // Configure mock behavior
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      // Act - Multiple calls
      const engine1 = await manager.getActiveEngine();

      // Reset mocks but keep same behavior
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const engine2 = await manager.getActiveEngine();

      // Reset mocks but keep same behavior
      (isWindowsDefenderRealTimeProtectionActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (checkClamdAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const engine3 = await manager.getActiveEngine();

      // Assert using toEqual
      expect(engine1).toEqual(engine2);
      expect(engine2).toEqual(engine3);
      expect(AntivirusWindowsDefender.createInstance as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
      expect(localMockWindowsDefenderInstance.stop).not.toHaveBeenCalled();
    });
  });
});
