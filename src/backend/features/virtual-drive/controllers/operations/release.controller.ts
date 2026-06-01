import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { release } from '../../services/operations/release.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';
export async function releaseController(req: Request, res: Response, container: Container) {
  const rawPath: string = req.body.path ?? '';
  const processName: string = req.body.processName ?? '';
  logger.debug({
    msg: `[FUSE DAEMON] Release signal received for path: ${rawPath} by process: ${processName}`,
  });
  const normalizedPath = ensureLeadingSlash(rawPath);

  const result = await release({ path: normalizedPath, processName, container });

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0 });
}
