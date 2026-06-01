import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { Request, Response } from 'express';
import { ensureLeadingSlash } from '../ensure-leading-slash';
import { rmdir } from '../../services/operations/rmdir.service';

export async function rmdirController(req: Request, res: Response, container: Container) {
  logger.debug({ msg: '[FUSE DAEMON] Rmdir signal received' });

  const rawPath: string = req.body.path ?? '';
  const normalizedPath = ensureLeadingSlash(rawPath);
  const response = await rmdir(normalizedPath, container);

  if (response.error) {
    logger.error({ msg: response.error.message });

    res.json({ errno: response.error.code });
    return;
  }

  res.json({ errno: 0 });
}
