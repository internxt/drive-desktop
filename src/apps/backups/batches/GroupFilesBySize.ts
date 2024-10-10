import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';

export class GroupFilesBySize {
  static small(files: Array<LocalFile>) {
    return files.filter((file) => file.isSmall());
  }

  static medium(files: Array<LocalFile>) {
    return files.filter((file) => file.isMedium());
  }

  static big(files: Array<LocalFile>) {
    return files.filter((file) => file.isBig());
  }
}
