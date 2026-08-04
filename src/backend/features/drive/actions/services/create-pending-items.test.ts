import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as statReaddir from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFolderInfoError } from '@/infra/node-win/services/get-folder-info';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as createFolder from './create-folder';
import * as createPendingFiles from './create-pending-files';
import { createPendingItems } from './create-pending-items';

describe('create-pending-items', () => {
  const statReaddirMock = partialSpyOn(statReaddir, 'statReaddir');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');
  const createPendingFilesMock = partialSpyOn(createPendingFiles, 'createPendingFiles');

  const rootPath = abs('/root');
  const folderPath = abs('/root/folder');

  function createProps({
    parentPath = rootPath,
    parentUuid = 'root' as FolderUuid,
    isFirstExecution = true,
    abortController = new AbortController(),
  } = {}) {
    return mockProps<typeof createPendingItems>({ ctx: { abortController }, parentPath, parentUuid, isFirstExecution });
  }

  it('should process files and nested placeholder folders iteratively', async () => {
    // Given
    const rootFile = abs('/root/file.txt');
    const nestedFile = abs('/root/folder/nested-file.txt');
    statReaddirMock.mockImplementation(({ folder }) => {
      if (folder === rootPath) return Promise.resolve({ files: [{ path: rootFile }], folders: [{ path: folderPath }] });
      if (folder === folderPath) return Promise.resolve({ files: [{ path: nestedFile }], folders: [] });
      return Promise.resolve({ files: [], folders: [] });
    });
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'folder' as FolderUuid } });

    // When
    await createPendingItems(createProps());

    // Then
    expect(statReaddirMock).toHaveBeenCalledWith(expect.objectContaining({ folder: rootPath }));
    expect(statReaddirMock).toHaveBeenCalledWith(expect.objectContaining({ folder: folderPath }));
    expect(createPendingFilesMock).toHaveBeenCalledWith(expect.objectContaining({ files: [{ path: rootFile }], parentUuid: 'root' }));
    expect(createPendingFilesMock).toHaveBeenCalledWith(expect.objectContaining({ files: [{ path: nestedFile }], parentUuid: 'folder' }));
  });

  it('should process children of a newly created folder without another createPendingItems call', async () => {
    // Given
    const nestedFile = abs('/root/folder/nested-file.txt');
    statReaddirMock.mockImplementation(({ folder }) => {
      if (folder === rootPath) return Promise.resolve({ files: [], folders: [{ path: folderPath }] });
      if (folder === folderPath) return Promise.resolve({ files: [{ path: nestedFile }], folders: [] });
      return Promise.resolve({ files: [], folders: [] });
    });
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    createFolderMock.mockResolvedValue('created-folder' as FolderUuid);

    // When
    await createPendingItems(createProps());

    // Then
    call(createFolderMock).toMatchObject({ path: folderPath, parentUuid: 'root', createPendingChildren: false });
    expect(createPendingFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({ files: [{ path: nestedFile }], parentUuid: 'created-folder' }),
    );
  });

  it('should not process children of an existing placeholder folder after first execution', async () => {
    // Given
    statReaddirMock.mockImplementation(({ folder }) => {
      if (folder === rootPath) return Promise.resolve({ files: [], folders: [{ path: folderPath }] });
      return Promise.resolve({ files: [], folders: [] });
    });
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'folder' as FolderUuid } });

    // When
    await createPendingItems(createProps({ isFirstExecution: false }));

    // Then
    expect(statReaddirMock).toHaveBeenCalledTimes(1);
    calls(createPendingFilesMock).toHaveLength(1);
  });

  it('should log errors while processing a directory', async () => {
    // Given
    statReaddirMock.mockRejectedValue(new Error());

    // When
    await createPendingItems(createProps());

    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating pending items', parentPath: rootPath });
  });

  it('should not process items when aborted', async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort();

    // When
    await createPendingItems(createProps({ abortController }));

    // Then
    calls(statReaddirMock).toHaveLength(0);
  });
});
