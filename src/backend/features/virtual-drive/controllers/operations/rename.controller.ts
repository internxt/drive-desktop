import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { rename } from '../../services/operations/rename.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function renameController(req: Request, res: Response, container: Container) {
  const rawOldPath = req.body.oldPath;
  const rawNewPath = req.body.newPath;

  if (typeof rawOldPath !== 'string' || typeof rawNewPath !== 'string') {
    logger.error({ msg: '[FUSE DAEMON] Rename: missing required fields', body: req.body });
    res.json({ errno: FuseCodes.EINVAL });
    return;
  }

  const oldPath = ensureLeadingSlash(rawOldPath);
  const newPath = ensureLeadingSlash(rawNewPath);

  logger.debug({ msg: '[FUSE DAEMON] Rename signal received', oldPath, newPath });

  const result = await rename({ src: oldPath, dest: newPath, container });

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0 });
}
