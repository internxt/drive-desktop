import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { resolveDaemonReady, daemonReady, stopDaemon, startDaemon } from './daemon.service';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('daemon.service', () => {
  describe('resolveDaemonReady', () => {
    it('should resolve the daemonReady promise', async () => {
      resolveDaemonReady();

      await expect(daemonReady).resolves.toBeUndefined();
    });
  });

  describe('startDaemon', () => {
    let fakeDaemon: EventEmitter & { kill: ReturnType<typeof vi.fn>; stderr: EventEmitter };

    beforeEach(() => {
      fakeDaemon = Object.assign(new EventEmitter(), {
        kill: vi.fn(),
        stderr: new EventEmitter(),
      });
      vi.mocked(spawn).mockReturnValue(fakeDaemon as unknown as ReturnType<typeof spawn>);
    });

    afterEach(async () => {
      const stopPromise = stopDaemon();
      fakeDaemon.emit('exit', 0);
      await stopPromise;
    });

    it('should spawn the daemon with the correct environment variables', () => {
      startDaemon('/mock/mount');

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.objectContaining({
          env: expect.objectContaining({
            INTERNXT_MOUNT: '/mock/mount',
          }),
        }),
      );
    });

    it('should reject if the daemon exits with a non-zero code', async () => {
      const startPromise = startDaemon('/mock/mount');
      fakeDaemon.emit('exit', 1);

      await expect(startPromise).rejects.toThrow('fuse daemon exited before ready with code 1');
    });
  });

  describe('stopDaemon', () => {
    it('should resolve immediately when no daemon is running', async () => {
      await expect(stopDaemon()).resolves.toBeUndefined();
    });

    it('should send SIGTERM and resolve when daemon exits', async () => {
      const fakeDaemon = Object.assign(new EventEmitter(), {
        kill: vi.fn(),
        stderr: new EventEmitter(),
      });
      vi.mocked(spawn).mockReturnValue(fakeDaemon as unknown as ReturnType<typeof spawn>);

      startDaemon('/mock/mount');

      const stopPromise = stopDaemon();
      fakeDaemon.emit('exit', 0);

      await expect(stopPromise).resolves.toBeUndefined();
      expect(fakeDaemon.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });
});
