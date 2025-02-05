import { AddedFilesBatchCreator } from '../../../../src/apps/backups/batches/AddedFilesBatchCreator';
import { LocalFileSize } from '../../../../src/context/local/localFile/domain/LocalFileSize';
import { LocalFileMother } from '../../../context/local/localFile/domain/LocalFileMother';

describe('AddedFilesBatchCreator', () => {
  it('should create batches of added files grouped by size', () => {
    const localFileSmall = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE - 1,
    });
    const localFileMedium = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_SMALL_FILE_SIZE + 1,
    });
    const localFileBig = LocalFileMother.fromPartial({
      size: LocalFileSize.MAX_MEDIUM_FILE_SIZE + 1,
    });

    const files = [localFileSmall, localFileMedium, localFileBig];

    const batches = AddedFilesBatchCreator.run(files);

    expect(batches.length).toBe(3);

    expect(batches[0]).toContain(localFileSmall);
    expect(batches[1]).toContain(localFileMedium);
    expect(batches[2]).toContain(localFileBig);

    expect(batches[0].length).toBe(1);
    expect(batches[1].length).toBe(1);
    expect(batches[2].length).toBe(1);
  });
});
