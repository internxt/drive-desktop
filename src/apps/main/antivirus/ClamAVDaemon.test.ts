import clamAVServer from './ClamAVDaemon';
import { ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';
import fs from 'fs';
import { Readable } from 'stream';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: jest.fn(() => 'drive-desktop-linux'),
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
  },
}));
jest.mock('net');
jest.mock('fs');
jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));
jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/user'),
}));

describe('ClamAVDaemon', () => {
  let mockChildProcess: Partial<ChildProcessWithoutNullStreams>;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const createMockStream = () => {
      const mockStream = new Readable();
      mockStream._read = jest.fn();
      return mockStream;
    };

    mockChildProcess = {
      stdout: createMockStream(),
      stderr: createMockStream(),
      on: jest.fn(),
      kill: jest.fn(),
    };

    if (mockChildProcess.stdout) {
      (mockChildProcess.stdout.on as any) = jest.fn();
    }
    if (mockChildProcess.stderr) {
      (mockChildProcess.stderr.on as any) = jest.fn();
    }

    const childProcess = jest.requireMock('child_process');
    childProcess.spawn.mockReturnValue(mockChildProcess);

    mockSocket = {
      connect: jest.fn((_port: number, _host: string, callback: () => void) => {
        if (callback) callback();
      }),
      on: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    };

    (net.Socket as unknown as jest.Mock) = jest.fn(() => mockSocket);

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fs.readdirSync as jest.Mock).mockReturnValue(['main.cvd', 'daily.cvd']);
    (fs.copyFileSync as jest.Mock).mockImplementation(() => undefined);
  });

  describe('checkClamdAvailability', () => {
    it('should resolve true when connection is successful', async () => {
      const result = await clamAVServer.checkClamdAvailability();

      expect(result).toBe(true);
      expect(net.Socket).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalledWith(
        3310,
        '127.0.0.1',
        expect.any(Function)
      );
    });

    it('should resolve false when connection fails', async () => {
      mockSocket.connect = jest.fn(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_port: number, _host: string, _callback: () => void) => {
          mockSocket.on.mockImplementation(
            (eventName: string, handler: (err: Error) => void) => {
              if (eventName === 'error') {
                handler(new Error('Connection refused'));
              }
            }
          );
        }
      );

      const result = await clamAVServer.checkClamdAvailability();

      expect(result).toBe(false);
      expect(mockSocket.destroy).toHaveBeenCalled();
    });
  });

  describe('startClamdServer', () => {
    it('should start the clamd server successfully', async () => {
      if (mockChildProcess.stdout) {
        (mockChildProcess.stdout.on as any) = jest.fn(
          (eventName: string, callback: (data: Buffer) => void) => {
            if (eventName === 'data') {
              callback(Buffer.from('Listening daemon'));
            }
            return mockChildProcess.stdout;
          }
        );
      }

      const startPromise = clamAVServer.startClamdServer();

      await startPromise;

      const childProcess = jest.requireMock('child_process');
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.stringContaining('/bin/clamd'),
        expect.arrayContaining([
          '--config-file',
          expect.any(String),
          '--foreground',
          '--debug',
        ])
      );
    });

    it('should handle server startup errors', async () => {
      if (mockChildProcess.stderr) {
        (mockChildProcess.stderr.on as any) = jest.fn(
          (eventName: string, callback: (data: Buffer) => void) => {
            if (eventName === 'data') {
              callback(
                Buffer.from('ERROR: Can not open/parse the config file')
              );
            }
            return mockChildProcess.stderr;
          }
        );
      }

      await expect(clamAVServer.startClamdServer()).rejects.toThrow(
        'ERROR: Can not open/parse the config file'
      );
    });
  });
});
