import { Request, Response } from 'express';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { resolveDaemonReady } from '../services/daemon.service';

type DaemonReadyBody = {
  bootId: string;
};

export function daemonReadyController(req: Request<object, object, DaemonReadyBody>, res: Response): void {
  logger.debug({ msg: '[FUSE DAEMON] daemon ready signal received' });
  resolveDaemonReady({ bootId: req.body.bootId });
  res.sendStatus(200);
}
