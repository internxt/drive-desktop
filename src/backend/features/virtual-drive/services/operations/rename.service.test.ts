import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { rename } from './rename.service';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError, FuseNoSuchFileOrDirectoryError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import * as handleFileRenameIntentModule from './rename/handle-file-rename-intent';
import * as handleFolderRenameIntentModule from './rename/handle-folder-rename-intent';
import * as handleOfflineUploadOnRenameModule from './rename/handle-temporal-file-upload-on-rename';
import { call, calls, partialSpyOn } from '../../../../../../tests/vitest/utils.helper';

describe('rename', () => {
  const fileHandlerMock = partialSpyOn(handleFileRenameIntentModule, 'handleFileRenameIntent');
  const folderHandlerMock = partialSpyOn(handleFolderRenameIntentModule, 'handleFolderRenameIntent');
  const uploadHandlerMock = partialSpyOn(handleOfflineUploadOnRenameModule, 'handleTemporalFileUploadOnRename');

  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    container = mockDeep<Container>();
    fileHandlerMock.mockResolvedValue({ data: undefined });
    folderHandlerMock.mockResolvedValue({ data: undefined });
    uploadHandlerMock.mockResolvedValue({ data: undefined });
  });

  it('should return success when file rename succeeds', async () => {
    fileHandlerMock.mockResolvedValue({ data: undefined });

    const result = await rename({ src: '/old/file.txt', dest: '/new/file.txt', container });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
    call(fileHandlerMock).toStrictEqual({ src: '/old/file.txt', dest: '/new/file.txt', container });
    calls(folderHandlerMock).toHaveLength(0);
    calls(uploadHandlerMock).toHaveLength(0);
  });

  it('should return success when folder rename succeeds', async () => {
    fileHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/old/folder') });
    folderHandlerMock.mockResolvedValue({ data: undefined });

    const result = await rename({ src: '/old/folder', dest: '/new/folder', container });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
    call(fileHandlerMock).toStrictEqual({ src: '/old/folder', dest: '/new/folder', container });
    call(folderHandlerMock).toStrictEqual({ src: '/old/folder', dest: '/new/folder', container });
    calls(uploadHandlerMock).toHaveLength(0);
  });

  it('should return success when upload on rename succeeds after ENOENT file/folder', async () => {
    fileHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/offline/file.txt') });
    folderHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/offline/file.txt') });
    uploadHandlerMock.mockResolvedValue({ data: undefined });

    const result = await rename({ src: '/offline/file.txt', dest: '/existing/file.txt', container });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
    call(fileHandlerMock).toStrictEqual({ src: '/offline/file.txt', dest: '/existing/file.txt', container });
    call(folderHandlerMock).toStrictEqual({ src: '/offline/file.txt', dest: '/existing/file.txt', container });
    call(uploadHandlerMock).toStrictEqual({ src: '/offline/file.txt', dest: '/existing/file.txt', container });
  });

  it('should return error when file rename fails', async () => {
    fileHandlerMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'file rename failed') });

    const result = await rename({ src: '/old/file.txt', dest: '/new/file.txt', container });

    expect(result.data).toBeUndefined();
    expect(result.error?.code).toBe(FuseCodes.EIO);
    calls(folderHandlerMock).toHaveLength(0);
    calls(uploadHandlerMock).toHaveLength(0);
  });

  it('should return non-ENOENT error from folder handler', async () => {
    fileHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/old/folder') });
    folderHandlerMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'folder rename failed') });

    const result = await rename({ src: '/old/folder', dest: '/new/folder', container });

    expect(result.data).toBeUndefined();
    expect(result.error?.code).toBe(FuseCodes.EIO);
    calls(uploadHandlerMock).toHaveLength(0);
  });

  it('should return ENOENT when upload on rename fails with no such file', async () => {
    fileHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/missing/path') });
    folderHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/missing/path') });
    uploadHandlerMock.mockResolvedValue({ error: new FuseNoSuchFileOrDirectoryError('/missing/path') });

    const result = await rename({ src: '/missing/path', dest: '/new/path', container });

    expect(result.data).toBeUndefined();
    expect(result.error?.code).toBe(FuseCodes.ENOENT);
  });
});
