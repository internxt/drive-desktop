import Chance from 'chance';
import { FileSize } from '../FileSize';
import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../../../../../backend/features/user/file-size-limit';
const chance = new Chance();

export class FileSizeMother {
  static random() {
    return new FileSize(chance.integer({ min: 0, max: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT }));
  }

  static primitive(): number {
    return FileSizeMother.random().value;
  }
}
