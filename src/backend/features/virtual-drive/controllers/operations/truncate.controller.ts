import { Request, Response } from 'express';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { truncate } from '../../services/operations/truncate.service';
import { ensureLeadingSlash } from '../ensure-leading-slash';

export async function truncateController(req: Request, res: Response, container: Container) {
  const rawPath: string = req.body.path ?? '';
  const rawSize = req.body.size;

  const size = Number.isInteger(rawSize) && rawSize >= 0 ? rawSize : Number.NaN;

  if (!rawPath || Number.isNaN(size)) {
    res.json({ errno: FuseCodes.EINVAL });
    return;
  }

  const normalizedPath = ensureLeadingSlash(rawPath);
  const result = await truncate({ path: normalizedPath, size, container });

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0 });
}
