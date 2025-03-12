import { renderHook, act } from '@testing-library/react-hooks';
import { useAntivirus } from './useAntivirus';

const originalWindow = { ...window };

describe('useAntivirus', () => {
  let progressCallbackStore: ((progress: any) => void) | null = null;

  const mockOnScanProgress = jest.fn().mockImplementation((cb) => {
    progressCallbackStore = cb;
    return Promise.resolve();
  });

  const mockRemoveScanProgressListener = jest.fn();
  const mockIsAvailable = jest.fn().mockResolvedValue(true);
  const mockAddItemsToScan = jest
    .fn()
    .mockResolvedValue(['file1.txt', 'file2.txt']);
  const mockScanItems = jest.fn().mockResolvedValue(undefined);
  const mockRemoveInfectedFiles = jest.fn().mockResolvedValue(undefined);
  const mockCancelScan = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    window.electron = {
      ...window.electron,
      antivirus: {
        onScanProgress: mockOnScanProgress,
        removeScanProgressListener: mockRemoveScanProgressListener,
        isAvailable: mockIsAvailable,
        isDefenderActive: jest.fn().mockResolvedValue(true),
        scanItems: mockScanItems,
        scanSystem: jest.fn().mockResolvedValue(undefined),
        addItemsToScan: mockAddItemsToScan,
        removeInfectedFiles: mockRemoveInfectedFiles,
        cancelScan: mockCancelScan,
      },
    };

    jest.clearAllMocks();
    progressCallbackStore = null;
  });

  afterEach(() => {
    window.electron = originalWindow.electron;
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAntivirus());

      expect(result.current.infectedFiles).toEqual([]);
      expect(result.current.currentScanPath).toBeUndefined();
      expect(result.current.countScannedFiles).toBe(0);
      expect(result.current.progressRatio).toBe(0);
      expect(result.current.isScanCompleted).toBe(false);
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isAntivirusAvailable).toBe(false);
      expect(result.current.showErrorState).toBe(false);
      expect(result.current.view).toBe('locked');
    });
  });

  describe('UI operations', () => {
    it('should properly handle scan again button click', () => {
      const { result } = renderHook(() => useAntivirus());

      act(() => {
        result.current.onScanAgainButtonClicked();
      });

      expect(result.current.view).toBe('chooseItems');
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(false);
      expect(result.current.infectedFiles).toEqual([]);
      expect(result.current.countScannedFiles).toBe(0);
      expect(result.current.progressRatio).toBe(0);
    });

    it('should handle system scan button click', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useAntivirus());

      let scanPromise: Promise<void> = Promise.resolve();
      act(() => {
        scanPromise = result.current.onScanUserSystemButtonClicked();
      });

      expect(result.current.view).toBe('scan');
      expect(result.current.isScanning).toBe(true);

      await scanPromise;

      expect(mockScanItems).toHaveBeenCalled();

      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(true);
    });

    it('should handle errors during scanning', async () => {
      mockScanItems.mockRejectedValueOnce(new Error('Scan failed'));

      const { result } = renderHook(() => useAntivirus());

      let scanPromise: Promise<void> = Promise.resolve();
      act(() => {
        scanPromise = result.current.onScanUserSystemButtonClicked();
      });

      expect(result.current.view).toBe('scan');
      expect(result.current.isScanning).toBe(true);

      await scanPromise;

      expect(mockScanItems).toHaveBeenCalled();

      expect(result.current.isScanning).toBe(false);
      expect(result.current.showErrorState).toBe(true);
      expect(result.current.isScanCompleted).toBe(false);
    });

    it('should handle canceling a scan', async () => {
      const { result } = renderHook(() => useAntivirus());

      act(() => {
        result.current.onScanUserSystemButtonClicked();
      });

      expect(result.current.view).toBe('scan');
      expect(result.current.isScanning).toBe(true);

      await act(async () => {
        await result.current.onCancelScan();
      });

      expect(mockCancelScan).toHaveBeenCalled();

      expect(result.current.view).toBe('chooseItems');
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(false);
      expect(result.current.infectedFiles).toEqual([]);
      expect(result.current.countScannedFiles).toBe(0);
      expect(result.current.progressRatio).toBe(0);
    });
  });

  describe('public methods', () => {
    it('should expose all required methods', () => {
      const { result } = renderHook(() => useAntivirus());

      expect(typeof result.current.onScanUserSystemButtonClicked).toBe(
        'function'
      );
      expect(typeof result.current.onScanAgainButtonClicked).toBe('function');
      expect(typeof result.current.onCancelScan).toBe('function');
    });
  });

  describe('progress handling', () => {
    it('should update state based on progress updates', () => {
      const { result } = renderHook(() => useAntivirus());

      expect(mockOnScanProgress).toHaveBeenCalled();

      expect(progressCallbackStore).not.toBeNull();

      act(() => {
        if (progressCallbackStore) {
          progressCallbackStore({
            scanId: 'test-scan-id',
            currentScanPath: '/path/to/file.txt',
            infectedFiles: ['infected.exe'],
            progress: 50,
            totalScannedFiles: 100,
            done: false,
          });
        }
      });

      expect(result.current.currentScanPath).toBe('/path/to/file.txt');
      expect(result.current.infectedFiles).toEqual(['infected.exe']);
      expect(result.current.progressRatio).toBe(50);
      expect(result.current.countScannedFiles).toBe(100);
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(false);

      act(() => {
        if (progressCallbackStore) {
          progressCallbackStore({
            scanId: 'test-scan-id',
            currentScanPath: '/path/to/last/file.txt',
            infectedFiles: ['infected.exe', 'virus.dll'],
            progress: 100,
            totalScannedFiles: 200,
            done: true,
          });
        }
      });

      expect(result.current.infectedFiles).toEqual([
        'infected.exe',
        'virus.dll',
      ]);
      expect(result.current.progressRatio).toBe(100);
      expect(result.current.countScannedFiles).toBe(200);
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(true);
    });
  });
});
