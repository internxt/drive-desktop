import express, { Router } from 'express';
import { buildContentsController } from '../controllers/contents';
import { VirtualDrive } from '../../VirtualDrive';
import { HydrationApiLogger } from '../HydrationApiLogger';

export function buildHydrationRouter(
  virtualDrive: VirtualDrive,
  logger: HydrationApiLogger
): Router {
  const controllers = buildContentsController(virtualDrive, logger);
  const router = express.Router();

  router.post('/:path', controllers.download);
  router.delete('/:path', controllers.remove);

  return router;
}
