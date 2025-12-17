/* eslint-disable @typescript-eslint/no-explicit-any */
import clamAVServer from './ClamAVDaemon';
import { ChildProcessWithoutNullStreams } from 'child_process';
import net from 'node:net';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { Mock } from 'vitest';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: vi.fn(() => 'drive-desktop-linux'),
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '1.0.0'),
  },
}));
vi.mock('net');
vi.mock('fs');
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));
vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/home/user'),
  },
}));

describe('ClamAVDaemon', () => {
  let mockChildProcess: Partial<ChildProcessWithoutNullStreams>;
  let mockSocket: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const createMockStream = () => {
      const mockStream = new Readable();
      mockStream._read = vi.fn();
      return mockStream;
    };

    mockChildProcess = {
      stdout: createMockStream(),
      stderr: createMockStream(),
      on: vi.fn(),
      kill: vi.fn(),
    };

    if (mockChildProcess.stdout) {
      (mockChildProcess.stdout.on as any) = vi.fn();
    }
    if (mockChildProcess.stderr) {
      (mockChildProcess.stderr.on as any) = vi.fn();
    }

    const { spawn } = await import('child_process');
    vi.mocked(spawn).mockReturnValue(mockChildProcess as any);

    mockSocket = {
      connect: vi.fn((_port: number, _host: string, callback: () => void) => {
        // Simulate async connection
        setImmediate(() => {
          if (callback) callback();
        });
        return mockSocket;
      }),
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate PONG response after a brief delay
          setImmediate(() => {
            callback(Buffer.from('PONG\n'));
          });
        }
        return mockSocket;
      }),
      end: vi.fn(),
      destroy: vi.fn(),
      write: vi.fn(),
    };

    (net.Socket as unknown as Mock) = vi.fn(() => mockSocket);

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.mkdirSync as Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as Mock).mockImplementation(() => undefined);
    (fs.readFileSync as Mock).mockReturnValue('LOGFILE_PATH\nDATABASE_DIRECTORY\nFRESHCLAM_LOG_PATH');
    (fs.readdirSync as Mock).mockReturnValue(['main.cvd', 'daily.cvd']);
    (fs.copyFileSync as Mock).mockImplementation(() => undefined);
  });

  describe('checkClamdAvailability', () => {
    it('should resolve true when connection is successful', async () => {
      const result = await clamAVServer.checkClamdAvailability();

      expect(result).toBe(true);
      expect(net.Socket).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalledWith(3310, '127.0.0.1', expect.any(Function));
    });

    it('should resolve false when connection fails', async () => {
      // Create a new mock socket for this test with error behavior
      const errorSocket = {
        connect: vi.fn(() => {
          // Don't call the callback, trigger error instead
          return errorSocket;
        }),
        on: vi.fn((event: string, callback: (err?: Error) => void) => {
          if (event === 'error') {
            // Trigger error immediately
            setImmediate(() => {
              callback(new Error('Connection refused'));
            });
          }
          return errorSocket;
        }),
        end: vi.fn(),
        destroy: vi.fn(),
        write: vi.fn(),
      };

      (net.Socket as unknown as Mock) = vi.fn(() => errorSocket);

      const result = await clamAVServer.checkClamdAvailability();

      expect(result).toBe(false);
      expect(errorSocket.destroy).toHaveBeenCalled();
    });
  });

  describe('startClamdServer', () => {
    it('should start the clamd server successfully', async () => {
      // Set up process.on mock (for 'close' event)
      mockChildProcess.on = vi.fn(() => {
        // Don't trigger close event in success case
        return mockChildProcess;
      }) as any;

      // Set up stdout mock to immediately call the data callback
      if (mockChildProcess.stdout) {
        (mockChildProcess.stdout.on as any) = vi.fn((eventName: string, callback: (data: Buffer) => void) => {
          if (eventName === 'data') {
            // Immediately trigger the callback with success message
            setImmediate(() => callback(Buffer.from('Listening daemon')));
          }
          return mockChildProcess.stdout;
        });
      }

      // Set up stderr mock to not trigger any errors
      if (mockChildProcess.stderr) {
        (mockChildProcess.stderr.on as any) = vi.fn(() => {
          // Don't trigger any errors in success case
          return mockChildProcess.stderr;
        });
      }

      await clamAVServer.startClamdServer();

      const { spawn } = await import('child_process');
      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('/bin/clamd'),
        expect.arrayContaining(['--config-file', expect.any(String), '--foreground', '--debug']),
        expect.objectContaining({ env: expect.any(Object) }),
      );
    });

    it('should handle server startup errors', async () => {
      // Set up process.on mock (for 'close' event)
      mockChildProcess.on = vi.fn(() => {
        return mockChildProcess;
      }) as any;

      // Set up stdout mock to not trigger success
      if (mockChildProcess.stdout) {
        (mockChildProcess.stdout.on as any) = vi.fn(() => {
          return mockChildProcess.stdout;
        });
      }

      if (mockChildProcess.stderr) {
        (mockChildProcess.stderr.on as any) = vi.fn((eventName: string, callback: (data: Buffer) => void) => {
          if (eventName === 'data') {
            // Immediately trigger the callback with error message
            setImmediate(() => callback(Buffer.from('ERROR: Can not open/parse the config file')));
          }
          return mockChildProcess.stderr;
        });
      }

      await expect(clamAVServer.startClamdServer()).rejects.toThrow('ERROR: Can not open/parse the config file');
    });
  });
});
