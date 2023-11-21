import { Request, Response } from 'express';
import { DependencyContainer } from '../../dependency-injection/DependencyContainer';
import Logger from 'electron-log';

export function buildContentsController(container: DependencyContainer) {
  const download = async (req: Request, res: Response) => {
    const id = req.params.id;

    Logger.info('DOWNLOAD PETICION TO:', id);

    const file = await container.filesSearcher.run({ contentsId: id });

    if (!file) {
      res.status(404).send();
      return;
    }

    await container.downloadContentsToPlainFile.run(file);

    res.send(`Contents ID: ${req.params.id}`);
  };

  return {
    download,
  };
}
