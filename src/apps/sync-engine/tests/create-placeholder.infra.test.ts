import { join } from 'node:path/posix';
import { BindingsManager } from '../BindingManager';
import { loggerMock, TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getConfig, ProcessSyncContext, setDefaultConfig } from '../config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { calls, deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
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
import { PinState } from '@/node-win/types/placeholder.type';
import { InxtJs } from '@/infra';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';

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
  const contentsDownloader = mockDeep<InxtJs.ContentsDownloader>();

  const rootFolderUuid = v4();
  const testFolder = join(TEST_FILES, v4());
  const rootPath = join(testFolder, 'root') as AbsolutePath;
  const file = join(rootPath, 'file.txt');
  const providerId = v4();

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
    fileUploader: environmentFileUploader,
    contentsDownloader,
    abortController: new AbortController(),
  };

  beforeEach(() => {
    getUserOrThrowMock.mockReturnValueOnce({ root_folder_id: 1 });
    environmentFileUploader.run.mockResolvedValueOnce({ data: 'contentsId' as ContentsId });
  });

  afterAll(async () => {
    await Addon.disconnectSyncRoot({ rootPath });
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should create placeholder', async () => {
    // Given
    invokeMock.mockImplementation((event) => {
      if (event === 'GET_UPDATED_REMOTE_ITEMS') {
        return Promise.resolve({ files: [], folders: [] });
      }

      if (event === 'persistFile') {
        return Promise.resolve({ data: { uuid: 'uuid' } });
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
        fileId: 'contentsId',
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

    // When
    await VirtualDrive.createSyncRootFolder({ rootPath: ctx.rootPath });
    await BindingsManager.start({ ctx });
    initWatcher({ ctx });

    await sleep(100);
    await writeFile(file, 'content');
    await sleep(5000);

    // Then
    calls(onAllMock).toMatchObject([
      { event: 'add', path: file, stats: { size: 7, blocks: 0, mtimeMs: 0 } },
      { event: 'change', path: file, stats: { size: 7, blocks: 0, mtimeMs: 0 } },
    ]);

    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', rootPath },
      { msg: 'Load in memory paths' },
      { msg: 'onReady' },
      { msg: 'Create file', path: file },
      { msg: 'File uploaded', path: file, contentsId: 'contentsId', size: 7 },
      {
        msg: 'On change event',
        path: file,
        pinState: PinState.Unspecified,
        blocks: 0,
        ctime: expect.any(Date),
        mtime: expect.any(Date),
        isChanged: true,
        isModified: true,
      },
    ]);
  });
});
