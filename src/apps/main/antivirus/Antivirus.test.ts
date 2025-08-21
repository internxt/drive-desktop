import { Antivirus } from './Antivirus';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';

jest.mock('@internxt/scan');
jest.mock('./ClamAVDaemon');
jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: jest.fn(() => 'drive-desktop-linux'),
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
  },
}));
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));
jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('fs', () => ({
  promises: {
    access: jest.fn().mockResolvedValue(undefined),
  },
  constants: {
    R_OK: 4,
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
    jest.clearAllMocks();

    mockNodeClam = {
      init: jest.fn().mockReturnThis(),
      isInfected: jest.fn(),
      ping: jest.fn().mockResolvedValue(true),
      closeAllSockets: jest.fn().mockResolvedValue(undefined),
    };

    (NodeClam as jest.Mock).mockImplementation(() => mockNodeClam);

    (clamAVServer.checkClamdAvailability as jest.Mock).mockResolvedValue(true);
    (clamAVServer.startClamdServer as jest.Mock).mockResolvedValue(undefined);
    (clamAVServer.waitForClamd as jest.Mock).mockResolvedValue(undefined);
    (clamAVServer.stopClamdServer as jest.Mock).mockReturnValue(undefined);
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
        })
      );
      expect(antivirus).toBeInstanceOf(Antivirus);
    });

    it('should throw an error if initialization fails', async () => {
      (clamAVServer.checkClamdAvailability as jest.Mock).mockResolvedValue(
        false
      );
      (clamAVServer.startClamdServer as jest.Mock).mockRejectedValue(
        new Error('Failed to start ClamAV daemon')
      );

      await expect(Antivirus.createInstance()).rejects.toThrow(
        'Failed to start ClamAV daemon'
      );
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
      (antivirus as any).ensureConnection = jest.fn().mockResolvedValue(false);

      await expect(antivirus.scanFile('/path/to/file.txt')).rejects.toThrow(
        'ClamAV is not initialized'
      );
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

      await expect(antivirus.stopClamAv()).rejects.toThrow(
        'ClamAv instance is not initialized'
      );
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
