import lodashChunk from 'lodash.chunk';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';

type Chucks = Array<Array<LocalFile>>;

const NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES = 16;

const NUMBER_OF_PARALLEL_QUEUES_FOR_MEDIUM_FILES = 6;

const NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES = 2;

export class GroupFilesInChunksBySize {
  static small(all: Array<LocalFile>): Chucks {
    return GroupFilesInChunksBySize.chunk(all, NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES);
  }

  static medium(all: Array<LocalFile>): Chucks {
    return GroupFilesInChunksBySize.chunk(all, NUMBER_OF_PARALLEL_QUEUES_FOR_MEDIUM_FILES);
  }

  static big(all: Array<LocalFile>): Chucks {
    return GroupFilesInChunksBySize.chunk(all, NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES);
  }

  private static chunk(files: Array<LocalFile>, size: number) {
    return lodashChunk(files, size);
  }
}
