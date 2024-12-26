import { GroupFilesBySize } from './GroupFilesBySize';
import { GroupFilesInChunksBySize } from './GroupFilesInChunksBySize';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';

export class AddedFilesBatchCreator {
  private static readonly sizes = ['empty', 'small', 'medium', 'big'] as const;

  static run(files: Array<LocalFile>): Array<Array<LocalFile>> {
    const nonEmptyFiles = files.filter((f) => f.size > 0);

    const batches = AddedFilesBatchCreator.sizes.flatMap((size) => {
      const groupedBySize = GroupFilesBySize[size](nonEmptyFiles);
      return GroupFilesInChunksBySize[size](groupedBySize);
    });

    return batches;
  }
}
