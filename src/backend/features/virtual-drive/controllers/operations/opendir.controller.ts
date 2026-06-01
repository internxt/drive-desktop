import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { opendir } from '../../services/operations/opendir.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function openDirController(req: Request, res: Response, container: Container) {
  const rawPath: string = req.body.path ?? '';
  logger.debug({ msg: `[FUSE DAEMON] OpenDir signal received for path: ${rawPath}` });
  const normalizedPath = ensureLeadingSlash(rawPath);

  const { data, error } = await opendir(normalizedPath, container);

  if (error) {
    logger.error({ msg: error.message });
    res.json({ errno: error.code });
    return;
  }

  res.json({ errno: 0, ...data });
}
