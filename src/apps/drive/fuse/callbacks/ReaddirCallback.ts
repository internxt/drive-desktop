import { Container } from 'diod';
import { FuseCallback } from './FuseCallback';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/search/FilesByFolderPathSearcher';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { TemporalFileByFolderFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByFolderFinder';
import { FuseIOError } from './FuseErrors';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: Container) {
    super('Read Directory');
  }

  async execute(path: string) {
    try {
      const start = performance.now();
      const [filesNames, foldersNames, temporalFiles] = await Promise.all([
        this.container.get(FilesByFolderPathSearcher).run(path),
        this.container.get(FoldersByParentPathLister).run(path),
        this.container.get(TemporalFileByFolderFinder).run(path),
      ]);

      const endPromises = performance.now();
      logger.debug({
        msg: `[ReaddirCallback] Time taken on Promises: ${endPromises - start}ms`
      });

      const auxiliaryFileName = temporalFiles.reduce((acc, file) => {
        if (file.isAuxiliary()) {
          acc.push(file.name);
        }
        return acc;
      }, [] as string[]);

      const endReduce = performance.now();
      logger.debug({
        msg: `[ReaddirCallback] Time taken on Reduce: ${endReduce - endPromises}ms`
      });

      const end = performance.now();
      logger.debug({ msg: `[ReaddirCallback] Time taken on Total: ${end - start}ms` });

      return this.right([
        '.',
        '..',
        ...filesNames,
        ...foldersNames,
        ...auxiliaryFileName,
      ]);
    } catch (error) {
      logger.error({ msg: '[ReaddirCallback] Error reading directory:', error });
      return this.left(new FuseIOError());
    }
  }
}
