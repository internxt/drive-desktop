import { raw, Router } from 'express';
import { Container } from 'diod';
import { OPERATION_PATHS } from '../constants';
import { getAttributesController } from '../controllers/operations/get-attributes.controller';
import { openController } from '../controllers/operations/open.controller';
import { openDirController } from '../controllers/operations/opendir.controller';
import { readController } from '../controllers/operations/read.controller';
import { truncateController } from '../controllers/operations/truncate.controller';
import { createController } from '../controllers/operations/create.controller';
import { writeController } from '../controllers/operations/write.controller';
import { releaseController } from '../controllers/operations/release.controller';
import { mkdirController } from '../controllers/operations/mkdir.controller';
import { renameController } from '../controllers/operations/rename.controller';
import { unlinkController } from '../controllers/operations/unlink.controller';
import { rmdirController } from '../controllers/operations/rmdir.controller';
import { statfsController } from '../controllers/operations/statfs.controller';

// Routes for FUSE operation endpoints (POST /op/<name>).
// Each operation will be registered here as it is implemented in PB-6161.
export function buildOperationsRouter(container: Container): Router {
  const router = Router();
  router.post(OPERATION_PATHS.GET_ATTR, (req, res) => getAttributesController(req, res, container));
  router.post(OPERATION_PATHS.OPEN, (req, res) => openController(req, res, container));
  router.post(OPERATION_PATHS.OPEN_DIR, (req, res) => openDirController(req, res, container));
  router.post(OPERATION_PATHS.READ, (req, res) => readController(req, res, container));
  router.post(OPERATION_PATHS.TRUNCATE, (req, res) => truncateController(req, res, container));
  router.post(OPERATION_PATHS.CREATE, (req, res) => createController(req, res, container));
  /**
   * v.2.6.0
   * Esteban Galvis Triana
   * FUSE write operations can send chunks up to 128 KB.
   * We keep the parser limit at 1 MB to avoid PayloadTooLarge errors
   * and provide safe headroom for binary write payload handling.
   */
  router.post(OPERATION_PATHS.WRITE, raw({ type: 'application/octet-stream', limit: '1mb' }), (req, res) =>
    writeController(req, res, container),
  );
  router.post(OPERATION_PATHS.RELEASE, (req, res) => releaseController(req, res, container));
  router.post(OPERATION_PATHS.MKDIR, (req, res) => mkdirController(req, res, container));
  router.post(OPERATION_PATHS.UNLINK, (req, res) => unlinkController(req, res, container));
  router.post(OPERATION_PATHS.RMDIR, (req, res) => rmdirController(req, res, container));
  router.post(OPERATION_PATHS.RENAME, (req, res) => renameController(req, res, container));
  router.post(OPERATION_PATHS.STAT_FS, (req, res) => statfsController(req, res, container));
  return router;
}
