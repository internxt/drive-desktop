import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { mkdir } from '../../services/operations/mkdir.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function mkdirController(req: Request, res: Response, container: Container) {
  const rawPath: string = req.body.path ?? '';
  logger.debug({ msg: `[FUSE DAEMON] Mkdir signal received for path: ${rawPath}` });

  const normalizedPath = ensureLeadingSlash(rawPath);
  const result = await mkdir(normalizedPath, container);

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0 });
}
