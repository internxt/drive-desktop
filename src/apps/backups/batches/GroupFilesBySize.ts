import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';

export class GroupFilesBySize {
  static small(files: Array<LocalFile>) {
    return files.filter((file) => file.size.isSmall());
  }

  static medium(files: Array<LocalFile>) {
    return files.filter((file) => file.size.isMedium());
  }

  static big(files: Array<LocalFile>) {
    return files.filter((file) => file.size.isBig());
  }
}
