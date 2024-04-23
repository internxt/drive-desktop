import { Request, Response } from 'express';
import Logger from 'electron-log';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileDownloader } from '../../../context/virtual-drive/files/application/download/FileDownloader';
import { LocalFileWriter } from '../../../context/offline-drive/LocalFile/application/write/LocalFileWriter';
import { LocalFileDeleter } from '../../../context/offline-drive/LocalFile/application/delete/LocalFileDeleter';

export function buildContentsController(container: Container) {
  const download = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    const file = await container.get(FirstsFileSearcher).run({ path });

    if (!file) {
      res.status(404).send();
      return;
    }

    const stream = await container.get(FileDownloader).run(file);
    await container.get(LocalFileWriter).run(file.contentsId, stream);

    res.status(201).send();
  };

  const remove = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    Logger.info('REMOVE:', path);

    const file = await container.get(FirstsFileSearcher).run({
      path,
    });

    if (!file) {
      res.status(404).send();
      return;
    }

    await container.get(LocalFileDeleter).run(file.contentsId);

    res.status(201).send();
  };

  return {
    download,
    remove,
  };
}
