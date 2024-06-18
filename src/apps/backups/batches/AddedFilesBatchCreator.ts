import { GroupFilesBySize } from './GroupFilesBySize';
import { GroupFilesInChunksBySize } from './GroupFilesInChunksBySize';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';

export class AddedFilesBatchCreator {
  private static readonly sizes = ['small', 'medium', 'big'] as const;

  static run(files: Array<LocalFile>): Array<Array<LocalFile>> {
    const batches = AddedFilesBatchCreator.sizes.flatMap((size) => {
      const groupedBySize = GroupFilesBySize[size](files);

      return GroupFilesInChunksBySize[size](groupedBySize);
    });

    return batches;
  }
}
