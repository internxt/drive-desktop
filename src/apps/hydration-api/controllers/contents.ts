import { Request, Response } from 'express';
import Logger from 'electron-log';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { DownloadContentsToPlainFile } from '../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentsDeleter } from '../../../context/virtual-drive/contents/application/LocalContentsDeleter';
export function buildContentsController(container: Container) {
  const download = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    Logger.info('DOWNLOAD:', path);

    const file = await container.get(FirstsFileSearcher).run({ path });

    if (!file) {
      res.status(404).send();
      return;
    }

    await container.get(DownloadContentsToPlainFile).run(file);

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

    await container.get(LocalContentsDeleter).run(file);

    res.status(201).send();
  };

  return {
    download,
    remove,
  };
}
