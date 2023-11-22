import { Request, Response } from 'express';
import { DependencyContainer } from '../../dependency-injection/DependencyContainer';
import Logger from 'electron-log';

export function buildContentsController(container: DependencyContainer) {
  const download = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    Logger.info('DOWNLOAD PETICION TO:', path);

    const file = await container.filesSearcher.run({ path: `/${path}` });

    if (!file) {
      res.status(404).send();
      return;
    }

    await container.downloadContentsToPlainFile.run(file);

    res.json({ id: file.contentsId });
  };

  return {
    download,
  };
}
