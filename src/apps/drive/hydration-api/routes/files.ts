import express, { Router } from 'express';
import { buildFilesControllers } from '../controllers/files';
import { Container } from 'diod';

export function buildFilesRouter(container: Container): Router {
  const controllers = buildFilesControllers(container);
  const router = express.Router();

  router.get('/', controllers.getAll);
  router.get('/filter', controllers.getByPartial);

  return router;
}
