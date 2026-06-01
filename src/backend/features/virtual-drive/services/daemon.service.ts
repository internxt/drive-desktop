import { spawn, ChildProcess } from 'node:child_process';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { PATHS } from '../../../../core/electron/paths';
import { FuseDriveStatus } from '../../../../apps/drive/fuse/FuseDriveStatus';
import { broadcastToWindows } from '../../../../apps/main/windows';

let resolveReady: () => void;
let daemon: ChildProcess | null = null;
let status: FuseDriveStatus = 'UNMOUNTED';
const SIGKILL_TIMEOUT_MS = 5_000;

export const daemonReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function resolveDaemonReady(): void {
  resolveReady();
}

export function getVirtualDriveState(): FuseDriveStatus {
  return status;
}

export function startDaemon(mountPoint: string): Promise<void> {
  const spawnedDaemon = spawn(PATHS.FUSE_DAEMON_BINARY, [], {
    env: {
      ...process.env,
      INTERNXT_MOUNT: mountPoint,
      INTERNXT_SOCKET: PATHS.FUSE_DAEMON_SOCKET,
      INTERNXT_LOG_FILE: PATHS.FUSE_DAEMON_LOG,
    },
  });

  daemon = spawnedDaemon;

  spawnedDaemon.stderr?.on('data', (data: Buffer) => {
    logger.debug({ msg: `[FUSE DAEMON] ${data.toString().trim()}` });
  });

  spawnedDaemon.once('exit', (code: number | null) => {
    if (code !== 0 && code !== null) {
      status = 'ERROR';
      broadcastToWindows('virtual-drive-status-change', 'ERROR');
    } else {
      status = 'UNMOUNTED';
    }
    daemon = null;
  });

  return new Promise((resolve, reject) => {
    spawnedDaemon.once('exit', (code: number) => {
      if (code !== 0) {
        reject(new Error(`fuse daemon exited before ready with code ${code}`));
      }
    });

    daemonReady.then(() => {
      logger.debug({ msg: '[VIRTUAL DRIVE] virtual drive mounted and ready' });
      status = 'MOUNTED';
      broadcastToWindows('virtual-drive-status-change', 'MOUNTED');
      resolve();
    });
  });
}

export function stopDaemon(): Promise<void> {
  return new Promise((resolve) => {
    if (!daemon) {
      status = 'UNMOUNTED';
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      logger.warn({ msg: '[FUSE DAEMON] daemon did not exit after SIGTERM, sending SIGKILL' });
      daemon?.kill('SIGKILL');
    }, SIGKILL_TIMEOUT_MS);

    daemon.once('exit', () => {
      clearTimeout(timeout);
      daemon = null;
      status = 'UNMOUNTED';
      resolve();
    });

    daemon.kill('SIGTERM');
  });
}
