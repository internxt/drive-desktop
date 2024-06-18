import { GroupFilesBySize } from './GroupFilesBySize';
import { GroupFilesInChunksBySize } from './GroupFilesInChunksBySize';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { File } from '../../../context/virtual-drive/files/domain/File';

export class ModifiedFilesBatchCreator {
  private static readonly sizes = ['small', 'medium', 'big'] as const;

  static run(files: Map<LocalFile, File>): Array<Map<LocalFile, File>> {
    const batches = ModifiedFilesBatchCreator.sizes.flatMap((size) => {
      const localFiles = Array.from(files.keys());

      const groupedBySize = GroupFilesBySize[size](localFiles);

      return GroupFilesInChunksBySize[size](groupedBySize);
    });

    return batches.map((batch) =>
      batch.reduce((map, local) => {
        const file = files.get(local);

        map.set(local, file);

        return map;
      }, new Map())
    );
  }
}
