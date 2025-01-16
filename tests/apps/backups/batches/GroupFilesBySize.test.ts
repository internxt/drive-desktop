import { GroupFilesBySize } from '../../../../src/apps/backups/batches/GroupFilesBySize';
import { LocalFileMother } from '../../../context/local/localFile/domain/LocalFileMother';
import { LocalFileSize } from '../../../../src/context/local/localFile/domain/LocalFileSize';

describe('GroupFilesBySize', () => {
  it('should return an empty array when no files are provided', () => {
    const groupedFiles = GroupFilesBySize.small([]); // Test for small files
    expect(groupedFiles).toEqual([]);
  });

  it('should group only empty files', () => {
    const emptyFile1 = LocalFileMother.fromPartial({ size: 0 });
    const emptyFile2 = LocalFileMother.fromPartial({ size: 0 });

    const groupedFiles = GroupFilesBySize.empty([emptyFile1, emptyFile2]);
    expect(groupedFiles).toEqual([emptyFile1, emptyFile2]);
  });

  it('should group mixed file sizes correctly', () => {
    const emptyFile = LocalFileMother.fromPartial({ size: 0 });
    const smallFile = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE - 1,
    });
    const mediumFile = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE + 1,
    });
    const bigFile = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_MEDIUM_FILE_SIZE + 1,
    });

    const files = [emptyFile, smallFile, mediumFile, bigFile];

    const groupedSmallFiles = GroupFilesBySize.small(files);
    const groupedMediumFiles = GroupFilesBySize.medium(files);
    const groupedBigFiles = GroupFilesBySize.big(files);
    const groupedEmptyFiles = GroupFilesBySize.empty(files);

    expect(groupedSmallFiles).toEqual([smallFile]);
    expect(groupedMediumFiles).toEqual([mediumFile]);
    expect(groupedBigFiles).toEqual([bigFile]);
    expect(groupedEmptyFiles).toEqual([emptyFile]);
  });

  it('should group all files of the same size correctly', () => {
    const smallFile1 = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE - 1,
    });
    const smallFile2 = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE - 1,
    });

    const groupedFiles = GroupFilesBySize.small([smallFile1, smallFile2]);
    expect(groupedFiles).toEqual([smallFile1, smallFile2]);
  });
});
