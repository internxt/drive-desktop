import * as FreshclamUpdater from './FreshclamUpdater';
import { ChildProcessWithoutNullStreams } from 'child_process';
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

describe('FreshclamUpdater', () => {
  let mockChildProcess: Partial<ChildProcessWithoutNullStreams>;

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
    };

    if (mockChildProcess.stdout) {
      (mockChildProcess.stdout.on as any) = jest.fn();
    }
    if (mockChildProcess.stderr) {
      (mockChildProcess.stderr.on as any) = jest.fn();
    }

    const mockSpawn = jest.requireMock('child_process').spawn;
    mockSpawn.mockReturnValue(mockChildProcess);
  });

  describe('runFreshclam', () => {
    it('should update the database successfully', async () => {
      if (mockChildProcess.stdout) {
        (mockChildProcess.stdout.on as any) = jest.fn(
          (eventName: string, callback: (data: Buffer) => void) => {
            if (eventName === 'data') {
              callback(Buffer.from('Database updated'));
            }
            return mockChildProcess.stdout;
          }
        );
      }

      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = jest.fn(
          (eventName: string, callback: any) => {
            if (eventName === 'close') {
              callback(0); // Exit code 0 means success
            }
            return mockChildProcess;
          }
        );
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).resolves.toBeUndefined();
      expect(jest.requireMock('child_process').spawn).toHaveBeenCalledWith(
        expect.stringContaining('/bin/freshclam'),
        expect.arrayContaining([
          '--config-file',
          expect.any(String),
          '--foreground',
        ])
      );
    });

    it('should handle update failure', async () => {
      if (mockChildProcess.stderr) {
        (mockChildProcess.stderr.on as any) = jest.fn(
          (eventName: string, callback: (data: Buffer) => void) => {
            if (eventName === 'data') {
              callback(Buffer.from('ERROR: Update failed'));
            }
            return mockChildProcess.stderr;
          }
        );
      }

      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = jest.fn(
          (eventName: string, callback: any) => {
            if (eventName === 'close') {
              callback(1);
            }
            return mockChildProcess;
          }
        );
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).rejects.toThrow();
    });

    it('should handle process errors', async () => {
      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = jest.fn(
          (eventName: string, callback: any) => {
            if (eventName === 'error') {
              callback(new Error('Process error'));
            }
            return mockChildProcess;
          }
        );
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).rejects.toThrow('Process error');
    });
  });
});
