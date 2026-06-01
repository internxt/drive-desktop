import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { TemporalFileDeleter } from '../../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileTrasher } from '../../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { FileStatuses } from '../../../../../context/virtual-drive/files/domain/FileStatus';
import { File } from '../../../../../context/virtual-drive/files/domain/File';
import { unlink } from './unlink.service';

vi.mock('@internxt/drive-desktop-core/build/backend');

describe('unlink', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const fileSearcher = mockDeep<FirstsFileSearcher>();
  const temporalFinder = mockDeep<TemporalFileByPathFinder>();
  const temporalDeleter = mockDeep<TemporalFileDeleter>();
  const fileTrasher = mockDeep<FileTrasher>();

  beforeEach(() => {
    container = mockDeep<Container>();

    container.get.calledWith(FirstsFileSearcher).mockReturnValue(fileSearcher);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFinder);
    container.get.calledWith(TemporalFileDeleter).mockReturnValue(temporalDeleter);
    container.get.calledWith(FileTrasher).mockReturnValue(fileTrasher);

    fileSearcher.run.mockResolvedValue(undefined);
    temporalFinder.run.mockResolvedValue(undefined);
  });

  it('should trash file when file exists', async () => {
    fileSearcher.run.mockResolvedValue(
      File.from({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: 'aabbccddeeff001122334455',
        folderId: 1,
        createdAt: new Date().toISOString(),
        modificationTime: new Date().toISOString(),
        path: '/some/file.txt',
        size: 1,
        updatedAt: new Date().toISOString(),
        status: FileStatuses.EXISTS,
      }),
    );

    const { data, error } = await unlink('/some/file.txt', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(fileTrasher.run).toHaveBeenCalledWith('aabbccddeeff001122334455');
  });

  it('should delete temporal file when regular file does not exist', async () => {
    temporalFinder.run.mockResolvedValue(
      TemporalFile.from({
        createdAt: new Date(),
        modifiedAt: new Date(),
        path: '/some/temp.txt',
        size: 10,
      }),
    );

    const { data, error } = await unlink('/some/temp.txt', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(temporalDeleter.run).toHaveBeenCalledWith('/some/temp.txt');
  });

  it('should return ENOENT when no file is found', async () => {
    const { data, error } = await unlink('/missing.txt', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.ENOENT);
  });

  it('should return success when a missing auxiliary file is unlinked', async () => {
    const { data, error } = await unlink('/some/file.txt~', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(temporalDeleter.run).not.toHaveBeenCalled();
  });

  it('should return EIO when file trash fails', async () => {
    fileSearcher.run.mockResolvedValue(
      File.from({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'ffeeddccbbaa001122334455',
        folderId: 1,
        createdAt: new Date().toISOString(),
        modificationTime: new Date().toISOString(),
        path: '/some/file.txt',
        size: 1,
        updatedAt: new Date().toISOString(),
        status: FileStatuses.EXISTS,
      }),
    );
    fileTrasher.run.mockRejectedValue(new Error('boom'));

    const { data, error } = await unlink('/some/file.txt', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
  });
});
