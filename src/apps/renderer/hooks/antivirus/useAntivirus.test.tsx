import { renderHook, act } from '@testing-library/react-hooks';
import { useAntivirus } from './useAntivirus';

const mockElectron = {
  antivirus: {
    onScanProgress: jest.fn(),
    removeScanProgressListener: jest.fn(),
    isAvailable: jest.fn(),
    addItemsToScan: jest.fn(),
    scanItems: jest.fn(),
    removeInfectedFiles: jest.fn(),
    cancelScan: jest.fn(),
  },
};

beforeEach(() => {
  global.window = {
    electron: mockElectron,
  } as any;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useAntivirus', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAntivirus());

      expect(result.current).toEqual(
        expect.objectContaining({
          infectedFiles: [],
          currentScanPath: undefined,
          countScannedFiles: 0,
          view: 'locked',
          isScanning: false,
          isScanCompleted: false,
          progressRatio: 0,
          isAntivirusAvailable: false,
          showErrorState: false,
        })
      );
    });

    it('should set up scan progress listener on mount', () => {
      renderHook(() => useAntivirus());
      expect(mockElectron.antivirus.onScanProgress).toHaveBeenCalled();
    });

    it('should clean up scan progress listener on unmount', () => {
      const { unmount } = renderHook(() => useAntivirus());
      unmount();
      expect(
        mockElectron.antivirus.removeScanProgressListener
      ).toHaveBeenCalled();
    });
  });

  describe('eligibility check', () => {
    it('should set view to chooseItems when antivirus is available', async () => {
      mockElectron.antivirus.isAvailable.mockResolvedValue(true);

      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.view).toBe('chooseItems');
      expect(result.current.isAntivirusAvailable).toBe(true);
    });

    it('should keep view as locked when antivirus is not available', async () => {
      mockElectron.antivirus.isAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.view).toBe('locked');
      expect(result.current.isAntivirusAvailable).toBe(false);
    });
  });

  describe('scan progress handling', () => {
    it('should update states when receiving scan progress', async () => {
      let scanResolve: () => void;
      const scanPromise = new Promise<void>((resolve) => {
        scanResolve = resolve;
      });

      mockElectron.antivirus.scanItems.mockReturnValue(scanPromise);

      const { result } = renderHook(() => useAntivirus());

      mockElectron.antivirus.isAvailable.mockResolvedValue(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.onScanUserSystemButtonClicked();
      });

      const progressCallback =
        mockElectron.antivirus.onScanProgress.mock.calls[0][0];

      await act(async () => {
        progressCallback({
          scanId: '123',
          currentScanPath: '/test/path',
          infectedFiles: ['infected.txt'],
          progress: 50,
          totalScannedFiles: 10,
          done: false,
        });
      });

      expect(result.current.currentScanPath).toBe('/test/path');
      expect(result.current.countScannedFiles).toBe(10);
      expect(result.current.progressRatio).toBe(50);
      expect(result.current.infectedFiles).toEqual(['infected.txt']);
      expect(result.current.isScanning).toBe(true);
      expect(result.current.isScanCompleted).toBe(false);

      await act(async () => {
        scanResolve();
        await scanPromise;
      });
    });

    it('should handle scan completion', async () => {
      const { result } = renderHook(() => useAntivirus());

      mockElectron.antivirus.isAvailable.mockResolvedValue(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.onScanUserSystemButtonClicked();
      });

      const progressCallback =
        mockElectron.antivirus.onScanProgress.mock.calls[0][0];

      await act(async () => {
        progressCallback({
          scanId: '123',
          currentScanPath: '/test/path',
          infectedFiles: ['infected.txt'],
          progress: 100,
          totalScannedFiles: 10,
          done: true,
        });
      });

      expect(result.current.isScanning).toBe(false);
      expect(result.current.isScanCompleted).toBe(true);
    });
  });

  describe('scan operations', () => {
    beforeEach(async () => {
      mockElectron.antivirus.isAvailable.mockResolvedValue(true);
    });

    it('should handle custom scan button click', async () => {
      mockElectron.antivirus.addItemsToScan.mockResolvedValue([
        { path: '/test/file.txt' },
      ]);

      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.onCustomScanButtonClicked('files');
      });

      expect(mockElectron.antivirus.addItemsToScan).toHaveBeenCalledWith(true);
      expect(mockElectron.antivirus.scanItems).toHaveBeenCalled();
      expect(result.current.view).toBe('scan');
    });

    it('should handle system scan button click', async () => {
      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.onScanUserSystemButtonClicked();
      });

      expect(mockElectron.antivirus.scanItems).toHaveBeenCalled();
      expect(result.current.view).toBe('scan');
    });

    it('should handle scan cancellation', async () => {
      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.onCancelScan();
      });

      expect(mockElectron.antivirus.cancelScan).toHaveBeenCalled();
      expect(result.current.view).toBe('chooseItems');
    });

    it('should handle infected files removal', async () => {
      const { result } = renderHook(() => useAntivirus());
      const infectedFiles = ['/test/infected.txt'];

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.onRemoveInfectedItems(infectedFiles);
      });

      expect(mockElectron.antivirus.removeInfectedFiles).toHaveBeenCalledWith(
        infectedFiles
      );
      expect(result.current.view).toBe('chooseItems');
    });
  });

  describe('error handling', () => {
    it('should set error state when scan fails', async () => {
      mockElectron.antivirus.scanItems.mockRejectedValue(
        new Error('Scan failed')
      );

      const { result } = renderHook(() => useAntivirus());

      await act(async () => {
        await result.current.onScanUserSystemButtonClicked();
      });

      expect(result.current.showErrorState).toBe(true);
      expect(result.current.isScanning).toBe(false);
    });
  });
});
