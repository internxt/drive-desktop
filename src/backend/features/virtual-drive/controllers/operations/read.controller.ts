import { Request, Response } from 'express';
import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { read } from '../../services/operations/read.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function readController(req: Request, res: Response, container: Container) {
  const { path: rawPath, length, offset } = req.body;
  const processName = typeof req.body.processName === 'string' ? req.body.processName : '';

  if (rawPath === undefined || length === undefined || offset === undefined) {
    logger.error({ msg: '[FUSE DAEMON] Read: missing required fields', body: req.body });
    res.set('X-Errno', String(FuseCodes.EINVAL));
    res.send(Buffer.alloc(0));
    return;
  }

  const normalizedPath = ensureLeadingSlash(rawPath);

  logger.debug({
    msg: `[FUSE DAEMON] Read signal received for path: ${normalizedPath} by process: ${processName} and length: ${length} offset: ${offset}`,
  });

  const result = await read(normalizedPath, length, offset, processName, container);

  if (result.error) {
    res.set('X-Errno', String(result.error.code));
    res.send(Buffer.alloc(0));
    return;
  }

  res.set('X-Errno', '0');
  res.set('Content-Type', 'application/octet-stream');
  res.send(result.data);
}
