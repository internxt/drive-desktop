import { FileAttributes } from '../../../context/virtual-drive/files/domain/File';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { RetrieveAllFiles } from '../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { FilesSearcherByPartialMatch } from '../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';

export function buildFilesControllers(container: Container) {
  const getAll = async (_req: Request, res: Response) => {
    const files = await container.get(RetrieveAllFiles).run();

    const result = files.map((file) => file.attributes());

    res.status(200).send({ files: result });
  };

  const filter = async (req: Request, res: Response) => {
    const filter = Object.entries(req.query)

      .map(([key, param]) => {
        return { key, value: param };
      })
      .reduce((partial: Partial<FileAttributes>, { key, value }: any) => {
        return {
          ...partial,
          [key]: value.toString(),
        };
      }, {});

    const files = await container.get(FilesSearcherByPartialMatch).run(filter);

    if (!files) {
      res.sendStatus(404);
      return;
    }

    res.status(200).send({ files: files.map((file) => file.attributes()) });
  };

  return { getAll, getByPartial: filter };
}
