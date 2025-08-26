import { join } from 'node:path';
import { BindingsManager } from '../BindingManager';
import { DependencyContainerFactory } from '../dependency-injection/DependencyContainerFactory';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getConfig, ProcessSyncContext, setDefaultConfig } from '../config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { deepMocked, getMockCalls, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { writeFile } from 'node:fs/promises';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { sleep } from '@/apps/main/util';
import { PinState } from '@/node-win/types/placeholder.type';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { mockDeep } from 'vitest-mock-extended';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ipcRenderer } from 'electron';
import { initializeVirtualDrive, virtualDrive } from '../dependency-injection/common/virtualDrive';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as onAll from '@/node-win/watcher/events/on-all.service';

vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/infra/inxt-js/file-uploader/environment-file-uploader'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('create-placeholder', () => {
  const onAllMock = partialSpyOn(onAll, 'onAll');
  const invokeMock = partialSpyOn(ipcRenderer, 'invoke');
  const createFileMock = vi.mocked(driveServerWip.files.createFile);
  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  const environmentFileUploader = mockDeep<EnvironmentFileUploader>();
  vi.mocked(EnvironmentFileUploader).mockImplementation(() => environmentFileUploader);

  const rootFolderUuid = v4();
  const testFolder = join(TEST_FILES, v4());
  const rootPath = join(testFolder, 'root');
  const queueManagerPath = join(testFolder, 'queue-manager.json');
  const file = join(rootPath, 'file.txt');
  const providerId = `{${rootFolderUuid.toUpperCase()}}`;

  beforeEach(() => {
    getUserOrThrowMock.mockReturnValueOnce({ root_folder_id: 1 });
    environmentFileUploader.run.mockResolvedValueOnce({ data: '012345678901234567890123' as ContentsId });
  });

  afterAll(() => {
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('Should create placeholder', async () => {
    // Given
    setDefaultConfig({
      rootPath,
      providerName: 'Internxt Drive',
      providerId,
      rootUuid: rootFolderUuid as FolderUuid,
      queueManagerPath,
    });

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
        uuid: v4() as FileUuid,
        modificationTime: new Date().toISOString(),
        plainName: 'plainName',
        userId: 1,
        type: 'png',
      },
    });

    initializeVirtualDrive();
    const container = DependencyContainerFactory.build();
    const bindingManager = new BindingsManager(container);

    const ctx: ProcessSyncContext = {
      ...getConfig(),
      virtualDrive,
      abortController: new AbortController(),
    };

    // When
    await bindingManager.start({ ctx });
    bindingManager.watch({ ctx });

    await sleep(100);
    await writeFile(file, 'content');
    await sleep(5000);

    // Then
    const status = container.virtualDrive.getPlaceholderState({ path: file });
    expect(status.pinState).toBe(PinState.AlwaysLocal);
    expect(getMockCalls(onAllMock)).toStrictEqual([{ event: 'add', path: file }]);
  });
});
