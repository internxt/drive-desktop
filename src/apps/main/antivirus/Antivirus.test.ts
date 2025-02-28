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
jest.mock('electron-log');

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

    (clamAVServer.checkClamdAvailability as jest.Mock).mockResolvedValue(
      undefined
    );
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
      const error = new Error('Initialization failed');
      (clamAVServer.checkClamdAvailability as jest.Mock).mockRejectedValue(
        error
      );

      await expect(Antivirus.createInstance()).rejects.toThrow(error);
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
      const result = await antivirus.scanFile('/path/to/file.txt');

      expect(mockNodeClam.isInfected).toHaveBeenCalledWith('/path/to/file.txt');
      expect(result).toEqual(mockScanResult);
    });

    it('should throw an error if ClamAV is not initialized', async () => {
      const antivirus = await Antivirus.createInstance();
      (antivirus as any).isInitialized = false;

      await expect(antivirus.scanFile('/path/to/file.txt')).rejects.toThrow(
        'ClamAV is not initialized'
      );
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
