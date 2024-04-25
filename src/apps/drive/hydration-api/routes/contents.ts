import { Container } from 'diod';
import express, { Router } from 'express';
import { buildContentsController } from '../controllers/contents';

export function buildHydrationRouter(container: Container): Router {
  const controllers = buildContentsController(container);
  const router = express.Router();

  router.post('/:path', controllers.download);
  router.delete('/:path', controllers.remove);

  return router;
}
