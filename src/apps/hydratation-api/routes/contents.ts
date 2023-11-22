import express, { Router } from 'express';
import { buildContentsController } from '../controllers/contents/download';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';

export function buildContentsRouter(container: DependencyContainer): Router {
  const controllers = buildContentsController(container);
  const router = express.Router();

  router.post('/download/:path', controllers.download);

  return router;
}
