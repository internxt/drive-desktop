import { join } from 'node:path';
import { BindingsManager } from '../BindingManager';
import { DependencyContainerFactory } from '../dependency-injection/DependencyContainerFactory';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { setDefaultConfig } from '../config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { writeFile } from 'node:fs/promises';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { sleep } from '@/apps/main/util';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { EnvironmentContentFileUploader } from '@/context/virtual-drive/contents/infrastructure/upload/EnvironmentContentFileUploader';
import { ContentsId } from '@/context/virtual-drive/contents/domain/ContentsId';
import { mockDeep } from 'vitest-mock-extended';

vi.mock(import('../ipcRendererSyncEngine'));
vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/context/virtual-drive/contents/infrastructure/upload/EnvironmentContentFileUploader'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('create-placeholder', () => {
  const invokeMock = deepMocked(ipcRendererSyncEngine.invoke);
  const createFileMock = vi.mocked(driveServerWip.files.createFile);
  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  const environmentContentFileUploader = mockDeep<EnvironmentContentFileUploader>();
  vi.mocked(EnvironmentContentFileUploader).mockImplementation(() => environmentContentFileUploader);

  const rootFolderUuid = v4();
  const testFolder = join(TEST_FILES, v4());
  const rootPath = join(testFolder, 'root');
  const file = join(rootPath, 'file.txt');
  const providerId = `{${rootFolderUuid.toUpperCase()}}`;

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockReturnValueOnce({ root_folder_id: 1 });
    environmentContentFileUploader.upload.mockResolvedValueOnce(new ContentsId('012345678901234567890123'));
  });

  afterAll(() => {
    VirtualDrive.unRegisterSyncRootByProviderId({ providerId });
  });

  it('Should create placeholder', async () => {
    // Given
    setDefaultConfig({
      rootPath,
      providerName: 'Internxt Drive',
      providerId,
      rootUuid: rootFolderUuid,
    });

    // @ts-expect-error we do not want to implement all events
    invokeMock.mockImplementation((event) => {
      if (event === 'GET_UPDATED_REMOTE_ITEMS') {
        return Promise.resolve({ files: [], folders: [] });
      }

      if (event === 'FIND_DANGLED_FILES') {
        return Promise.resolve([]);
      }
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
        size: 'size',
        status: 'EXISTS',
        updatedAt: new Date().toISOString(),
        uuid: v4(),
        folder: {},
        modificationTime: new Date().toISOString(),
        plainName: 'plainName',
        userId: 1,
        type: 'png',
      },
    });

    const container = DependencyContainerFactory.build();
    const bindingManager = new BindingsManager(container);

    // When
    await bindingManager.start();
    await bindingManager.watch();

    await sleep(100);
    await writeFile(file, 'content');
    await sleep(10000);

    // Then
    const status = container.virtualDrive.getPlaceholderState({ path: file });
    expect(status.pinState).toBe(PinState.AlwaysLocal);
    expect(status.syncState).toBe(SyncState.InSync);
  });
});
