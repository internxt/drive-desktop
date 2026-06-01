import { Router } from 'express';
import { daemonReadyController } from '../controllers/daemon.controller';
import { DAEMON_PATHS } from '../constants';

export function buildDaemonRouter(): Router {
  const router = Router();

  router.post(DAEMON_PATHS.READY, daemonReadyController);

  return router;
}
