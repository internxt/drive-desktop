import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../../../../../src/backend/features/user/file-size-limit';
import { FileSize } from '../../../../../src/context/virtual-drive/files/domain/FileSize';

describe('File Size', () => {
  it('can create a file size up to the absolute upload limit', () => {
    expect(() => new FileSize(ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT)).not.toThrow();
  });

  it('can create a file size of 0', () => {
    expect(() => new FileSize(0)).not.toThrow();
  });

  it('cannot create a file size of negative values', () => {
    expect(() => new FileSize(-1)).toThrow();
  });

  it('cannot create a file size greater than the absolute upload limit', () => {
    expect(() => new FileSize(ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1)).toThrow();
  });
});
