import { ModifiedFilesBatchCreator } from './ModifiedFilesBatchCreator';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { LocalFileSize } from '../../../context/local/localFile/domain/LocalFileSize';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { LocalFileMother } from '../../../context/local/localFile/domain/__test-helpers__/LocalFileMother';
import { FileMother } from '../../../context/virtual-drive/files/domain/__test-helpers__/FileMother';
describe('ModifiedFilesBatchCreator', () => {
  it('should create batches of modified files grouped by size', () => {
    const localFileSmall = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE - 1,
    });
    const localFileMedium = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE + 1,
    });
    const localFileBig = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_MEDIUM_FILE_SIZE + 1,
    });

    const smallFile = FileMother.fromPartial({});
    const mediumFile = FileMother.fromPartial({});
    const bigFile = FileMother.fromPartial({});

    const files = new Map<LocalFile, File>([
      [localFileSmall, smallFile],
      [localFileMedium, mediumFile],
      [localFileBig, bigFile],
    ]);

    const batches = ModifiedFilesBatchCreator.run(files);

    expect(batches.length).toBe(3);

    expect(batches[0].get(localFileSmall)).toBeDefined();
    expect(batches[1].get(localFileMedium)).toBeDefined();
    expect(batches[2].get(localFileBig)).toBeDefined();

    expect(batches[0].size).toBe(1);
    expect(batches[1].size).toBe(1);
    expect(batches[2].size).toBe(1);

    expect(batches[0].get(localFileSmall)).toBe(smallFile);
    expect(batches[1].get(localFileMedium)).toBe(mediumFile);
    expect(batches[2].get(localFileBig)).toBe(bigFile);
  });
});
