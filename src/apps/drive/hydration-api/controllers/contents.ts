import { Request, Response } from 'express';
import { VirtualDrive } from '../../VirtualDrive';
import { HydrationApiLogger } from '../HydrationApiLogger';
import { getStatusForError } from './VirtualDriveErrorToStatusMap';

export function buildContentsController(
  virtualDrive: VirtualDrive,
  logger: HydrationApiLogger
) {
  const download = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    const result = await virtualDrive.makeFileLocallyAvailable(path);

    if (result.isLeft()) {
      const error = result.getLeft();

      logger.error(error);

      const status = getStatusForError(error);
      res.sendStatus(status);
    }

    res.status(201).send();
  };

  const remove = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    const result = await virtualDrive.makeFileRemoteOnly(path);

    if (result.isLeft()) {
      const error = result.getLeft();

      logger.error(error);

      const status = getStatusForError(error);
      res.sendStatus(status);
    }

    res.status(201).send();
  };

  return {
    download,
    remove,
  };
}
