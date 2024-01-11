import {
  OfflineFile,
  OfflineFileAttributes,
} from '../../../../../src/context/offline-drive/files/domain/OfflineFile';
import * as uuid from 'uuid';
import { FilePathMother } from '../../../virtual-drive/files/domain/FilePathMother';
import { FileSizeMother } from '../../../virtual-drive/files/domain/FileSizeMother';

export class OfflineFileMother {
  static any(): OfflineFile {
    return OfflineFile.from({
      id: uuid.v4(),
      createdAt: Date.now(),
      path: FilePathMother.random().value,
      size: FileSizeMother.random().value,
    });
  }

  static fromPartial(partial: Partial<OfflineFileAttributes>): OfflineFile {
    const complete = OfflineFileMother.any().attributes();

    return OfflineFile.from({
      ...complete,
      ...partial,
    });
  }
}
