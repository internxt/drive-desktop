import { rmSync } from 'node:fs';
import express from 'express';
import { Server } from 'node:http';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { PATHS } from '../../../../core/electron/paths';
import { DAEMON_ROUTE, OPERATIONS_ROUTE } from '../constants';
import { buildDaemonRouter } from '../routes/daemon.routes';
import { buildOperationsRouter } from '../routes/operations.routes';

let server: Server | null = null;

export function startFuseDaemonServer(container: Container): Promise<void> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    app.use(DAEMON_ROUTE, buildDaemonRouter());
    app.use(OPERATIONS_ROUTE, buildOperationsRouter(container));

    rmSync(PATHS.FUSE_DAEMON_SOCKET, { force: true });

    server = app.listen(PATHS.FUSE_DAEMON_SOCKET, () => {
      logger.debug({ msg: '[FUSE DAEMON] server listening', socket: PATHS.FUSE_DAEMON_SOCKET });
      resolve();
    });
  });
}

export function stopFuseDaemonServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      rmSync(PATHS.FUSE_DAEMON_SOCKET, { force: true });
      server = null;
      resolve();
    });
  });
}
