import express, { Router } from 'express';
import { buildFilesControllers } from '../controllers/files';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';

export function buildFilesRouter(container: DependencyContainer): Router {
  const controllers = buildFilesControllers(container);
  const router = express.Router();

  router.get('/', controllers.getAll);
  router.get('/filter', controllers.getByPartial);

  return router;
}
