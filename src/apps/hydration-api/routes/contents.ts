import express, { Router } from 'express';
import { buildContentsController } from '../controllers/contents';
import { Container } from 'diod';

export function buildContentsRouter(container: Container): Router {
  const controllers = buildContentsController(container);
  const router = express.Router();

  router.post('/:path', controllers.download);
  router.delete('/:path', controllers.remove);

  return router;
}
