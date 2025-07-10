import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AntivirusClamAV } from './antivirus-clam-av';
import * as clamAVServer from './ClamAVDaemon';
import NodeClam from '@internxt/scan';
import { app } from 'electron';

// Define interfaces for mocks
interface MockClamInstance {
  init: ReturnType<typeof vi.fn>;
  isInfected: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  closeAllSockets: ReturnType<typeof vi.fn>;
}

interface ScanResult {
  file: string;
  isInfected: boolean;
  viruses: string[];
}

// Type for checking protected instance properties with type assertion
type PrivateInstanceProps = {
  isInitialized: boolean;
  clamAv: MockClamInstance | null;
};

// Mock dependencies
vi.mock('@internxt/scan');
vi.mock('./ClamAVDaemon');
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
}));

vi.mock('process', () => ({
  cwd: () => '/mock/cwd',
  resourcesPath: '/mock/resources',
}));

describe('AntivirusClamAV', () => {
  let mockClamInstance: MockClamInstance;
  let checkClamdAvailabilitySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock NodeClam instance
    mockClamInstance = {
      init: vi.fn(),
      isInfected: vi.fn(),
      ping: vi.fn(),
      closeAllSockets: vi.fn(),
    };

    // Mock NodeClam constructor
    (NodeClam as unknown as { mockImplementation: (cb: () => MockClamInstance) => void }).mockImplementation(() => mockClamInstance);

    // Mock ClamAV server check
    checkClamdAvailabilitySpy = vi.fn().mockResolvedValue(true);
    vi.spyOn(clamAVServer, 'checkClamdAvailability').mockImplementation(checkClamdAvailabilitySpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInstance', () => {
    it('should create and initialize a new instance successfully', async () => {
      // Verifies that a new instance of AntivirusClamAV is created and initialized
      // with the correct configuration settings.
      // Arrange
      mockClamInstance.init.mockResolvedValue(mockClamInstance);

      // Act
      const instance = await AntivirusClamAV.createInstance();

      // Assert
      expect(instance).toBeInstanceOf(AntivirusClamAV);
      expect(checkClamdAvailabilitySpy).toHaveBeenCalledOnce();
      expect(mockClamInstance.init).toHaveBeenCalledWith({
        removeInfected: false,
        debugMode: false,
        scanRecursively: true,
        clamdscan: {
          path: expect.stringContaining('clamdscan.exe'),
          socket: false,
          host: '127.0.0.1',
          localFallback: false,
          port: 3310,
          timeout: 3600000,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });
    });

    it('should throw error when ClamAV daemon is not available', async () => {
      // Ensures an error is thrown when the ClamAV daemon is unavailable.
      // Arrange
      checkClamdAvailabilitySpy.mockRejectedValue(new Error('ClamAV daemon not available'));

      // Act & Assert
      await expect(AntivirusClamAV.createInstance()).rejects.toThrow('ClamAV daemon not available');
    });

    it('should throw error when NodeClam initialization fails', async () => {
      // Ensures an error is thrown when the NodeClam initialization fails.
      // Arrange
      mockClamInstance.init.mockRejectedValue(new Error('NodeClam init failed'));

      // Act & Assert
      await expect(AntivirusClamAV.createInstance()).rejects.toThrow('NodeClam init failed');
    });
  });

  describe('initialize', () => {
    it('should initialize ClamAV with correct configuration for packaged app', async () => {
      // Verifies that ClamAV is initialized with the correct configuration
      // when the application is packaged.
      Object.defineProperty(app, 'isPackaged', { value: true });
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      const instance = new AntivirusClamAV();

      // Act
      await instance.initialize();

      // Assert
      expect(mockClamInstance.init).toHaveBeenCalledWith(
        expect.objectContaining({
          clamdscan: expect.objectContaining({
            path: expect.stringContaining('clamdscan.exe'),
          }),
        }),
      );
    });

    it('should initialize ClamAV with correct configuration for development', async () => {
      // Verifies that ClamAV is initialized with the correct configuration
      // when the application is in development mode.
      Object.defineProperty(app, 'isPackaged', { value: false });
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      const instance = new AntivirusClamAV();

      // Act
      await instance.initialize();

      // Assert
      expect(mockClamInstance.init).toHaveBeenCalledWith(
        expect.objectContaining({
          clamdscan: expect.objectContaining({
            path: expect.stringContaining('clamdscan.exe'),
          }),
        }),
      );
    });

    it('should set isInitialized to true after successful initialization', async () => {
      // Ensures that the isInitialized property is set to true
      // after ClamAV is successfully initialized.
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      const instance = new AntivirusClamAV();

      // Act
      await instance.initialize();

      // Assert
      expect((instance as unknown as PrivateInstanceProps).isInitialized).toBe(true);
    });
  });

  describe('scanFile', () => {
    it('should scan file successfully when initialized', async () => {
      // Verifies that a file is scanned successfully when ClamAV is initialized.
      const mockScanResult: ScanResult = {
        file: '/path/to/file.txt',
        isInfected: false,
        viruses: [],
      };
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      mockClamInstance.isInfected.mockResolvedValue(mockScanResult);

      const instance = await AntivirusClamAV.createInstance();

      // Act
      const result = await instance.scanFile('/path/to/file.txt');

      // Assert
      expect(result).toEqual(mockScanResult);
      expect(mockClamInstance.isInfected).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should return infected result when virus is detected', async () => {
      // Verifies that the scanFile method returns the correct result
      // when a file is infected with a virus.
      const mockScanResult: ScanResult = {
        file: '/path/to/infected.txt',
        isInfected: true,
        viruses: ['Trojan.Generic'],
      };
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      mockClamInstance.isInfected.mockResolvedValue(mockScanResult);

      const instance = await AntivirusClamAV.createInstance();

      // Act
      const result = await instance.scanFile('/path/to/infected.txt');

      // Assert
      expect(result).toEqual(mockScanResult);
      expect(result.isInfected).toBe(true);
      expect(result.viruses).toContain('Trojan.Generic');
    });

    it('should throw error when not initialized', async () => {
      // Ensures an error is thrown when scanFile is called
      // without initializing ClamAV.
      const instance = new AntivirusClamAV();

      // Act & Assert
      await expect(instance.scanFile('/path/to/file.txt')).rejects.toThrow('ClamAV is not initialized');
    });

    it('should throw error when ClamAV instance is null', async () => {
      // Ensures an error is thrown when scanFile is called
      // and the ClamAV instance is null.
      const instance = new AntivirusClamAV();
      (instance as unknown as PrivateInstanceProps).isInitialized = true;
      (instance as unknown as PrivateInstanceProps).clamAv = null;

      // Act & Assert
      await expect(instance.scanFile('/path/to/file.txt')).rejects.toThrow('ClamAV is not initialized');
    });
  });

  describe('stop', () => {
    it('should stop ClamAV successfully when running', async () => {
      // Verifies that ClamAV is stopped successfully when it is running.
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      mockClamInstance.ping.mockResolvedValue(true);
      mockClamInstance.closeAllSockets.mockResolvedValue(undefined);

      const instance = await AntivirusClamAV.createInstance();

      // Act
      await instance.stop();

      // Assert
      expect(mockClamInstance.ping).toHaveBeenCalledOnce();
      expect(mockClamInstance.closeAllSockets).toHaveBeenCalledOnce();
      expect((instance as unknown as PrivateInstanceProps).isInitialized).toBe(false);
    });

    it('should not close sockets when ClamAV is not alive', async () => {
      // Ensures that sockets are not closed when ClamAV is not alive.
      mockClamInstance.init.mockResolvedValue(mockClamInstance);
      mockClamInstance.ping.mockResolvedValue(false);

      const instance = await AntivirusClamAV.createInstance();

      // Act
      await instance.stop();

      // Assert
      expect(mockClamInstance.ping).toHaveBeenCalledOnce();
      expect(mockClamInstance.closeAllSockets).not.toHaveBeenCalled();
    });

    it('should throw error when ClamAV instance is null', async () => {
      // Ensures an error is thrown when stop is called
      // and the ClamAV instance is null.
      const instance = new AntivirusClamAV();
      (instance as unknown as PrivateInstanceProps).clamAv = null;

      // Act & Assert
      await expect(instance.stop()).rejects.toThrow('ClamAv instance is not initialized');
    });
  });

  describe('configuration', () => {
    it('should use correct ClamAV configuration settings', async () => {
      // Verifies that ClamAV is initialized with the correct configuration settings.
      mockClamInstance.init.mockResolvedValue(mockClamInstance);

      // Act
      await AntivirusClamAV.createInstance();

      // Assert
      expect(mockClamInstance.init).toHaveBeenCalledWith({
        removeInfected: false,
        debugMode: false,
        scanRecursively: true,
        clamdscan: {
          path: expect.stringContaining('clamdscan.exe'),
          socket: false,
          host: '127.0.0.1',
          localFallback: false,
          port: 3310,
          timeout: 3600000,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });
    });
  });
});
