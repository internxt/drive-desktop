/* eslint-disable @typescript-eslint/no-explicit-any */
import { Antivirus } from './Antivirus';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';
import { Mock } from 'vitest';

vi.mock('@internxt/scan');
vi.mock('./ClamAVDaemon');
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: vi.fn(() => 'drive-desktop-linux'),
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '1.0.0'),
  },
}));
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));
vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/mock/home'),
  },
}));
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('fs', () => ({
  default: {
    promises: {
      access: vi.fn().mockResolvedValue(undefined),
    },
    constants: {
      R_OK: 4,
    },
  },
}));

type ScanResult = {
  file: string;
  isInfected: boolean;
  viruses: any[];
};

describe('Antivirus', () => {
  let mockNodeClam: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodeClam = {
      init: vi.fn().mockReturnThis(),
      isInfected: vi.fn(),
      ping: vi.fn().mockResolvedValue(true),
      closeAllSockets: vi.fn().mockResolvedValue(undefined),
    };

    (NodeClam as Mock).mockImplementation(() => mockNodeClam);

    (clamAVServer.checkClamdAvailability as Mock).mockResolvedValue(true);
    (clamAVServer.startClamdServer as Mock).mockResolvedValue(undefined);
    (clamAVServer.waitForClamd as Mock).mockResolvedValue(undefined);
    (clamAVServer.stopClamdServer as Mock).mockReturnValue(undefined);
  });

  describe('createInstance', () => {
    it('should create and initialize an Antivirus instance', async () => {
      const antivirus = await Antivirus.createInstance();

      expect(clamAVServer.checkClamdAvailability).toHaveBeenCalled();
      expect(NodeClam).toHaveBeenCalled();
      expect(mockNodeClam.init).toHaveBeenCalledWith(
        expect.objectContaining({
          removeInfected: false,
          debugMode: true,
          scanRecursively: true,
          preference: 'clamdscan',
        }),
      );
      expect(antivirus).toBeInstanceOf(Antivirus);
    });

    it('should throw an error if initialization fails', async () => {
      (clamAVServer.checkClamdAvailability as Mock).mockResolvedValue(false);
      (clamAVServer.startClamdServer as Mock).mockRejectedValue(new Error('Failed to start ClamAV daemon'));

      await expect(Antivirus.createInstance()).rejects.toThrow('Failed to start ClamAV daemon');
    });
  });

  describe('scanFile', () => {
    it('should scan a file and return the result', async () => {
      const mockScanResult: ScanResult = {
        file: '/path/to/file.txt',
        isInfected: false,
        viruses: [],
      };

      mockNodeClam.isInfected.mockResolvedValue(mockScanResult);

      const antivirus = await Antivirus.createInstance();
      (antivirus as any).clamAv = mockNodeClam;
      (antivirus as any).isInitialized = true;

      const result = await antivirus.scanFile('/path/to/file.txt');

      expect(mockNodeClam.isInfected).toHaveBeenCalledWith('/path/to/file.txt');
      expect(result).toEqual(mockScanResult);
    });

    it('should throw an error if ClamAV is not initialized', async () => {
      const antivirus = await Antivirus.createInstance();

      (antivirus as any).isInitialized = false;
      (antivirus as any).connectionRetries = 3;
      (antivirus as any).ensureConnection = vi.fn().mockResolvedValue(false);

      await expect(antivirus.scanFile('/path/to/file.txt')).rejects.toThrow('ClamAV is not initialized');
    });

    it('should retry scan if connection issues are encountered', async () => {
      const mockScanResult: ScanResult = {
        file: '/path/to/file.txt',
        isInfected: false,
        viruses: [],
      };

      const antivirus = await Antivirus.createInstance();
      (antivirus as any).clamAv = mockNodeClam;
      (antivirus as any).isInitialized = true;

      mockNodeClam.isInfected
        .mockRejectedValueOnce(new Error('connection error'))
        .mockResolvedValueOnce(mockScanResult);

      const result = await antivirus.scanFileWithRetry('/path/to/file.txt');

      expect(mockNodeClam.isInfected).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockScanResult);
    });
  });

  describe('stopClamAv', () => {
    it('should close all sockets if ClamAV is alive', async () => {
      const antivirus = await Antivirus.createInstance();
      await antivirus.stopClamAv();

      expect(mockNodeClam.ping).toHaveBeenCalled();
      expect(mockNodeClam.closeAllSockets).toHaveBeenCalled();
      expect((antivirus as any).isInitialized).toBe(false);
    });

    it('should throw an error if ClamAV is not initialized', async () => {
      const antivirus = await Antivirus.createInstance();
      (antivirus as any).clamAv = null;

      await expect(antivirus.stopClamAv()).rejects.toThrow('ClamAv instance is not initialized');
    });
  });

  describe('stopServer', () => {
    it('should call stopClamdServer', async () => {
      const antivirus = await Antivirus.createInstance();
      await antivirus.stopServer();

      expect(clamAVServer.stopClamdServer).toHaveBeenCalled();
    });
  });
});
