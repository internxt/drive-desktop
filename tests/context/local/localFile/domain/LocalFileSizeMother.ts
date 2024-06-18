import { LocalFileSize } from '../../../../../src/context/local/localFile/domain/LocalFileSize';

export class LocalFileSizeMother {
  static small(): LocalFileSize {
    return new LocalFileSize(LocalFileSize.MAX_SMALL_FILE_SIZE);
  }
  static medium(): LocalFileSize {
    return new LocalFileSize(LocalFileSize.MAX_MEDIUM_FILE_SIZE);
  }
  static big(): LocalFileSize {
    return new LocalFileSize(LocalFileSize.MAX_MEDIUM_FILE_SIZE + 1);
  }
}
