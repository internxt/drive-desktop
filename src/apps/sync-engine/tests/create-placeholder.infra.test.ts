import { join } from 'node:path';
import { BindingsManager } from '../BindingManager';
import { DependencyContainerFactory } from '../dependency-injection/DependencyContainerFactory';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { clearConfig, setDefaultConfig } from '../config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { PATHS } from '@/core/electron/paths';
import { writeFile } from 'node:fs/promises';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { sleep } from '@/apps/main/util';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';

vi.mock(import('../ipcRendererSyncEngine'));

describe('create-placeholder', () => {
  const invokeMock = deepMocked(ipcRendererSyncEngine.invoke);
  const createFileMock = vi.mocked(driveServerWip.files.createFile);

  const rootFolderUuid = v4();
  const testFolder = join(TEST_FILES, v4());
  const rootPath = join(testFolder, 'root');
  const queueManagerPath = join(testFolder, 'queue-manager.json');

  const providerId = `{${rootFolderUuid.toUpperCase()}}`;
  clearConfig();
  setDefaultConfig({ rootPath, providerName: 'Internxt Drive', providerId, rootUuid: rootFolderUuid });
  const container = DependencyContainerFactory.build();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    VirtualDrive.unRegisterSyncRootByProviderId({ providerId });
  });

  it('Should create placeholder', async () => {
    // Given
    const file = join(rootPath, 'file.txt');

    // @ts-expect-error we do not want to implement all events
    invokeMock.mockImplementation((event) => {
      if (event === 'GET_UPDATED_REMOTE_ITEMS') {
        return Promise.resolve({ files: [], folders: [] });
      }

      if (event === 'FIND_DANGLED_FILES') {
        return Promise.resolve([]);
      }

      if (event === 'GET_PATHS') {
        return Promise.resolve({ ...PATHS, QUEUE_MANAGER: queueManagerPath });
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
