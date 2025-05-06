import { BackupsDanglingFilesService } from './BackupsDanglingFilesService';
import { LocalFileMother } from '../../../tests/context/local/localFile/domain/LocalFileMother';
import { FileMother } from '../../../tests/context/virtual-drive/files/domain/FileMother';
import { left, right } from '../../context/shared/domain/Either';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { File } from '../../context/virtual-drive/files/domain/File';
import { StorageFileService } from '../../context/storage/StorageFiles/StorageFileService';

// Mock the Environment module
jest.mock('@internxt/inxt-js', () => ({
  Environment: {
    get: jest.fn(),
  },
}));

describe('BackupsDanglingFilesService', () => {
  let sut: BackupsDanglingFilesService;
  let storageFileService: jest.Mocked<StorageFileService>;

  beforeEach(() => {
    storageFileService = {
      isFileDownloadable: jest.fn(),
    } as unknown as jest.Mocked<StorageFileService>;

    sut = new BackupsDanglingFilesService(storageFileService);
  });

  it('should add to result if file is not downloadable', async () => {
    const localFile = LocalFileMother.any();
    const remoteFile = FileMother.fromPartial({});
    const dangling = new Map([[localFile, remoteFile]]);

    storageFileService.isFileDownloadable.mockResolvedValueOnce(right(false));

    const result = await sut.handleDanglingFilesOnBackup(dangling);

    expect(result.size).toBe(1);
    expect(result.get(localFile)).toBe(remoteFile);
  });

  it('should NOT add to result if file is downloadable', async () => {
    const localFile = LocalFileMother.any();
    const remoteFile = FileMother.fromPartial({});
    const dangling = new Map([[localFile, remoteFile]]);

    storageFileService.isFileDownloadable.mockResolvedValueOnce(right(true));

    const result = await sut.handleDanglingFilesOnBackup(dangling);

    expect(result.size).toBe(0);
  });

  it('should NOT add to result if isFileDownloadable returns left(error)', async () => {
    const localFile = LocalFileMother.any();
    const remoteFile = FileMother.fromPartial({});
    const dangling = new Map([[localFile, remoteFile]]);

    storageFileService.isFileDownloadable.mockResolvedValueOnce(
      left(new Error('Something went wrong'))
    );

    const result = await sut.handleDanglingFilesOnBackup(dangling);

    expect(result.size).toBe(0);
  });

  it('should NOT add to result if isFileDownloadable throws an error', async () => {
    const localFile = LocalFileMother.any();
    const remoteFile = FileMother.fromPartial({});
    const dangling = new Map([[localFile, remoteFile]]);

    storageFileService.isFileDownloadable.mockRejectedValueOnce(
      new Error('Unexpected crash')
    );

    const result = await sut.handleDanglingFilesOnBackup(dangling);

    expect(result.size).toBe(0);
  });

  it('should handle multiple dangling files with mixed outcomes', async () => {
    const local1 = LocalFileMother.any();
    const remote1 = FileMother.fromPartial({
      contentsId: 'id-000000000000000000001',
    });

    const local2 = LocalFileMother.any();
    const remote2 = FileMother.fromPartial({
      contentsId: 'id-000000000000000000002',
    });

    const local3 = LocalFileMother.any();
    const remote3 = FileMother.fromPartial({
      contentsId: 'id-000000000000000000003',
    });

    const local4 = LocalFileMother.any();
    const remote4 = FileMother.fromPartial({
      contentsId: 'id-000000000000000000004',
    });

    const danglingMap = new Map<LocalFile, File>([
      [local1, remote1], // right(false) → should be added
      [local2, remote2], // right(true) → should be ignored
      [local3, remote3], // left(error) → should be ignored
      [local4, remote4], // throws → should be ignored
    ]);

    storageFileService.isFileDownloadable
      .mockResolvedValueOnce(right(false)) // local1 → added
      .mockResolvedValueOnce(right(true)) // local2 → skipped
      .mockResolvedValueOnce(left(new Error('oops'))) // local3 → skipped
      .mockRejectedValueOnce(new Error('crash')); // local4 → skipped

    const result = await sut.handleDanglingFilesOnBackup(danglingMap);

    expect(result.size).toBe(1);
    expect(result.get(local1)).toBe(remote1);
    expect(result.has(local2)).toBe(false);
    expect(result.has(local3)).toBe(false);
    expect(result.has(local4)).toBe(false);
  });
});
