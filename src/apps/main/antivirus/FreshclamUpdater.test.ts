/* eslint-disable @typescript-eslint/no-explicit-any */
import * as FreshclamUpdater from './FreshclamUpdater';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { Readable } from 'node:stream';

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
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => 'LOGFILE_PATH\nDATABASE_DIRECTORY\nFRESHCLAM_LOG_PATH'),
    readdirSync: vi.fn(() => ['main.cvd', 'daily.cvd']),
    copyFileSync: vi.fn(),
  },
}));

describe('FreshclamUpdater', () => {
  let mockChildProcess: Partial<ChildProcessWithoutNullStreams>;

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
    };

    if (mockChildProcess.stdout) {
      (mockChildProcess.stdout.on as any) = vi.fn();
    }
    if (mockChildProcess.stderr) {
      (mockChildProcess.stderr.on as any) = vi.fn();
    }

    const { spawn } = await import('child_process');
    vi.mocked(spawn).mockReturnValue(mockChildProcess as ChildProcessWithoutNullStreams);
  });

  describe('runFreshclam', () => {
    it('should update the database successfully', async () => {
      if (mockChildProcess.stdout) {
        (mockChildProcess.stdout.on as any) = vi.fn((eventName: string, callback: (data: Buffer) => void) => {
          if (eventName === 'data') {
            callback(Buffer.from('Database updated'));
          }
          return mockChildProcess.stdout;
        });
      }

      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = vi.fn((eventName: string, callback: any) => {
          if (eventName === 'close') {
            callback(0); // Exit code 0 means success
          }
          return mockChildProcess;
        });
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).resolves.toBeUndefined();

      const { spawn } = await import('child_process');
      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('/bin/freshclam'),
        expect.arrayContaining(['--config-file', expect.any(String), '--foreground']),
        expect.objectContaining({ env: expect.any(Object) }),
      );
    });

    it('should handle update failure', async () => {
      if (mockChildProcess.stderr) {
        (mockChildProcess.stderr.on as any) = vi.fn((eventName: string, callback: (data: Buffer) => void) => {
          if (eventName === 'data') {
            callback(Buffer.from('ERROR: Update failed'));
          }
          return mockChildProcess.stderr;
        });
      }

      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = vi.fn((eventName: string, callback: any) => {
          if (eventName === 'close') {
            callback(1);
          }
          return mockChildProcess;
        });
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).rejects.toThrow();
    });

    it('should handle process errors', async () => {
      if (mockChildProcess.on) {
        (mockChildProcess.on as any) = vi.fn((eventName: string, callback: any) => {
          if (eventName === 'error') {
            callback(new Error('Process error'));
          }
          return mockChildProcess;
        });
      }

      const result = FreshclamUpdater.runFreshclam();

      await expect(result).rejects.toThrow('Failed to start update process');
    });
  });
});
