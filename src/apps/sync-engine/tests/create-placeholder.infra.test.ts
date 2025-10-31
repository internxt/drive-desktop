import { join, posix, win32 } from 'node:path';
import { BindingsManager } from '../BindingManager';
import { loggerMock, TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getConfig, ProcessSyncContext, setDefaultConfig } from '../config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { call, calls, deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { writeFile } from 'node:fs/promises';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { sleep } from '@/apps/main/util';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { mockDeep } from 'vitest-mock-extended';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ipcRenderer } from 'electron';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as onAll from '@/node-win/watcher/events/on-all.service';
import * as addPendingItems from '../in/add-pending-items';
import { buildProcessContainer } from '../build-process-container';
import { PinState } from '@/node-win/types/placeholder.type';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/infra/inxt-js/file-uploader/environment-file-uploader'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('create-placeholder', () => {
  partialSpyOn(addPendingItems, 'addPendingItems');
  const onAllMock = partialSpyOn(onAll, 'onAll');
  const invokeMock = partialSpyOn(ipcRenderer, 'invoke');
  const createFileMock = vi.mocked(driveServerWip.files.createFile);
  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  const environmentFileUploader = mockDeep<EnvironmentFileUploader>();

  const rootFolderUuid = v4();
  const testFolder = join(TEST_FILES, v4());
  const rootPath = createAbsolutePath(testFolder, 'root');
  const syncRootPath = rootPath.replaceAll(posix.sep, win32.sep);
  const file = join(rootPath, 'file.txt');
  const providerId = `{${rootFolderUuid.toUpperCase()}}`;

  setDefaultConfig({
    rootPath,
    providerName: 'Internxt Drive',
    providerId,
    rootUuid: rootFolderUuid as FolderUuid,
  });

  const config = getConfig();
  const ctx: ProcessSyncContext = {
    ...config,
    logger: loggerMock,
    virtualDrive: new VirtualDrive(config),
    fileUploader: environmentFileUploader,
    abortController: new AbortController(),
  };

  beforeEach(() => {
    getUserOrThrowMock.mockReturnValueOnce({ root_folder_id: 1 });
    environmentFileUploader.run.mockResolvedValueOnce({ data: '012345678901234567890123' as ContentsId });
  });

  afterAll(() => {
    BindingsManager.stop({ ctx });
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('should create placeholder', async () => {
    // Given

    invokeMock.mockImplementation((event) => {
      if (event === 'GET_UPDATED_REMOTE_ITEMS') {
        return Promise.resolve({ files: [], folders: [] });
      }

      if (event === 'FIND_DANGLED_FILES') {
        return Promise.resolve([]);
      }

      if (event === 'fileCreateOrUpdate') {
        return Promise.resolve({});
      }

      return Promise.resolve();
    });

    const fileUuid = v4() as FileUuid;
    createFileMock.mockResolvedValueOnce({
      data: {
        bucket: 'bucket',
        createdAt: new Date().toISOString(),
        creationTime: new Date().toISOString(),
        encryptVersion: 'encryptVersion',
        fileId: '012345678901234567890123',
        folderId: 1,
        folderUuid: rootFolderUuid,
        id: 1,
        name: 'name',
        size: '1',
        status: 'EXISTS',
        updatedAt: new Date().toISOString(),
        uuid: fileUuid,
        modificationTime: new Date().toISOString(),
        plainName: 'plainName',
        userId: 1,
        type: 'png',
      },
    });

    const config = getConfig();
    const ctx: ProcessSyncContext = {
      ...config,
      logger: loggerMock,
      virtualDrive: new VirtualDrive(config),
      fileUploader: environmentFileUploader,
      abortController: new AbortController(),
    };

    const container = buildProcessContainer({ ctx });

    // When
    await ctx.virtualDrive.createSyncRootFolder();
    await BindingsManager.start({ ctx, container });
    BindingsManager.watch({ ctx });

    await sleep(100);
    await writeFile(file, 'content');
    await sleep(5000);

    // Then
    call(onAllMock).toStrictEqual({ event: 'add', path: file });
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Registering sync root', syncRootPath },
      { msg: 'connectSyncRoot', connectionKey: { hr: 0, connectionKey: expect.any(String) } },
      { tag: 'SYNC-ENGINE', msg: 'Tree built', workspaceId: '', files: 0, folders: 1, trashedFiles: 0, trashedFolders: 0 },
      { tag: 'SYNC-ENGINE', msg: 'Load in memory paths', rootPath: syncRootPath },
      { msg: 'onReady' },
      { msg: 'Create file', path: '/file.txt' },
      { tag: 'SYNC-ENGINE', msg: 'File uploaded', path: '/file.txt', contentsId: '012345678901234567890123', size: 7 },
      { tag: 'SYNC-ENGINE', msg: 'Convert to placeholder succeeded', itemPath: '/file.txt', id: `FILE:${fileUuid}` },
      {
        msg: 'Change event triggered',
        path: '/file.txt',
        pinState: PinState.Unspecified,
        diff: { ctimeMs: { curr: expect.any(Number), prev: expect.any(Number) } },
      },
    ]);
  });
});
