import express, { Router } from 'express';
import { buildContentsController } from '../controllers/contents';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';

export function buildContentsRouter(container: DependencyContainer): Router {
  const controllers = buildContentsController(container);
  const router = express.Router();

  router.post('/:path', controllers.download);
  router.delete('/:path', controllers.remove);

  return router;
}
