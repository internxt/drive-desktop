import { spawn, ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { PATHS } from '../../../../core/electron/paths';
import { FuseDriveStatus } from '../FuseDriveStatus';
import { broadcastToWindows } from '../../../../apps/main/windows';

type DaemonReadyState = {
  bootId: string;
  resolve: () => void;
};

let daemonReadyState: DaemonReadyState | undefined;
let daemon: ChildProcess | null = null;
let status: FuseDriveStatus = 'UNMOUNTED';
const SIGKILL_TIMEOUT_MS = 5_000;

export function resolveDaemonReady({ bootId }: { bootId: string }): void {
  if (!daemonReadyState) {
    logger.warn({ msg: '[FUSE DAEMON] received ready signal before daemon startup' });
    return;
  }

  if (bootId !== daemonReadyState.bootId) {
    logger.warn({
      msg: '[FUSE DAEMON] ignored ready signal with stale boot id',
      bootId,
      activeBootId: daemonReadyState.bootId,
    });
    return;
  }

  daemonReadyState.resolve();
  daemonReadyState = undefined;
}

export function getVirtualDriveState(): FuseDriveStatus {
  return status;
}

export function startDaemon(mountPoint: string): Promise<void> {
  const bootId = randomUUID();

  const daemonReady = new Promise<void>((resolve) => {
    daemonReadyState = { bootId, resolve };
  });

  const spawnedDaemon = spawn(PATHS.FUSE_DAEMON_BINARY, [], {
    env: {
      ...process.env,
      INTERNXT_MOUNT: mountPoint,
      INTERNXT_SOCKET: PATHS.FUSE_DAEMON_SOCKET,
      INTERNXT_LOG_FILE: PATHS.FUSE_DAEMON_LOG,
      INTERNXT_BOOT_ID: bootId,
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

    if (daemonReadyState?.bootId === bootId) {
      daemonReadyState = undefined;
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
