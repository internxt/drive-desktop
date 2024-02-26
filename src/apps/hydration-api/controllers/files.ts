import { FileAttributes } from '../../../context/virtual-drive/files/domain/File';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { Request, Response } from 'express';

export function buildFilesControllers(container: DependencyContainer) {
  const getAll = async (_req: Request, res: Response) => {
    const files = await container.retrieveAllFiles.run();

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

    const file = await container.filesSearcher.run(filter);

    if (!file) {
      res.sendStatus(404);
      return;
    }

    res.status(200).send({ file: file.attributes() });
  };

  return { getAll, getByPartial: filter };
}
