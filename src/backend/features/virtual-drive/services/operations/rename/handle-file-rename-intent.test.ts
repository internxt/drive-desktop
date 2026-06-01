import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { handleFileRenameIntent } from './handle-file-rename-intent';
import * as trashFileModule from './trash-file';
import * as moveFileModule from './move-file';
import { call, calls, partialSpyOn } from '../../../../../../../tests/vitest/utils.helper';

const fileAttrs: FileAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contentsId: 'aabbccddeeff001122334455',
  folderId: 0,
  createdAt: new Date().toISOString(),
  modificationTime: new Date().toISOString(),
  path: '/old/file.txt',
  size: 100,
  updatedAt: new Date().toISOString(),
  status: FileStatuses.EXISTS,
};

describe('handle-file-rename-intent', () => {
  const trashFileMock = partialSpyOn(trashFileModule, 'trashFile');
  const moveFileMock = partialSpyOn(moveFileModule, 'moveFile');
  let container: ReturnType<typeof mockDeep<Container>>;
  let searcherMock: ReturnType<typeof mockDeep<FirstsFileSearcher>>;

  const props: Parameters<typeof handleFileRenameIntent>[0] = {
    src: '/old/file.txt',
    dest: '/new/file.txt',
    container: undefined as unknown as Container,
  };

  beforeEach(() => {
    searcherMock = mockDeep<FirstsFileSearcher>();
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(searcherMock);
    props.container = container;
    trashFileMock.mockResolvedValue({ data: undefined });
    moveFileMock.mockResolvedValue({ data: undefined });
  });

  it('should return ENOENT when file is not found', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    const result = await handleFileRenameIntent(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.ENOENT);
    calls(trashFileMock).toHaveLength(0);
    calls(moveFileMock).toHaveLength(0);
  });

  it('should delegate to trashFile when dest starts with /.Trash', async () => {
    // Given
    const file = File.from(fileAttrs);
    searcherMock.run.mockResolvedValue(file);

    // When
    const result = await handleFileRenameIntent({ ...props, dest: '/.Trash/file.txt' });

    // Then
    expect(result.data).toBeUndefined();
    call(trashFileMock).toStrictEqual({ file, container });
    calls(moveFileMock).toHaveLength(0);
  });

  it('should delegate to moveFile when dest is a regular path', async () => {
    // Given
    const file = File.from(fileAttrs);
    searcherMock.run.mockResolvedValue(file);

    // When
    const result = await handleFileRenameIntent(props);

    // Then
    expect(result.data).toBeUndefined();
    call(moveFileMock).toStrictEqual({ file, src: props.src, dest: props.dest, container });
    calls(trashFileMock).toHaveLength(0);
  });

  it('should return success without moving when dest is an auxiliary path', async () => {
    // Given
    const file = File.from(fileAttrs);
    searcherMock.run.mockResolvedValue(file);

    // When
    const result = await handleFileRenameIntent({ ...props, dest: '/old/file.txt~' });

    // Then
    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
    calls(moveFileMock).toHaveLength(0);
    calls(trashFileMock).toHaveLength(0);
  });

  it('should propagate error from trashFile', async () => {
    // Given
    const file = File.from(fileAttrs);
    searcherMock.run.mockResolvedValue(file);
    trashFileMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'trash failed') });

    // When
    const result = await handleFileRenameIntent({ ...props, dest: '/.Trash/file.txt' });

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
  });

  it('should propagate error from moveFile', async () => {
    // Given
    const file = File.from(fileAttrs);
    searcherMock.run.mockResolvedValue(file);
    moveFileMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'move failed') });

    // When
    const result = await handleFileRenameIntent(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
  });

  it('should search for file with EXISTS status and src path', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    await handleFileRenameIntent(props);

    // Then
    call(searcherMock.run).toStrictEqual({ path: props.src, status: FileStatuses.EXISTS });
  });
});
