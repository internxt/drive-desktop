import { Request, Response } from 'express';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { resolveDaemonReady } from '../services/daemon.service';

export function daemonReadyController(_: Request, res: Response): void {
  logger.debug({ msg: '[FUSE DAEMON] daemon ready signal received' });
  resolveDaemonReady();
  res.sendStatus(200);
}
