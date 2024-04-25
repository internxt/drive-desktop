import { Container } from 'diod';
import { Request, Response } from 'express';
import { StorageFileDeleter } from '../../../../context/storage/StorageFiles/application/delete/StorageFileDeleter';
import { MakeStorageFileAvaliableOffline } from '../../../../context/storage/StorageFiles/application/offline/MakeStorageFileAvaliableOffline';

export function buildContentsController(container: Container) {
  const download = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    await container.get(MakeStorageFileAvaliableOffline).run(path);

    res.status(201).send();
  };

  const remove = async (req: Request, res: Response) => {
    const decodedBuffer = Buffer.from(req.params.path, 'base64');

    const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

    await container.get(StorageFileDeleter).run(path);

    res.status(201).send();
  };

  return {
    download,
    remove,
  };
}
