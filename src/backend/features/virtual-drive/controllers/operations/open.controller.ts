import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { open } from '../../services/operations/open.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function openController(req: Request, res: Response, container: Container) {
  const rawPath: string = req.body.path ?? '';
  logger.debug({
    msg: `[FUSE DAEMON] Open signal received for path: ${rawPath} by process: ${req.body.processName ?? ''}`,
  });
  const processName: string = req.body.processName ?? '';
  const normalizedPath = ensureLeadingSlash(rawPath);

  const result = await open(normalizedPath, processName, container);

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0 });
}
