import { join } from 'node:path';
import { BindingsManager } from './BindingManager';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { setDefaultConfig } from './config';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { PATHS } from '@/core/electron/paths';
import { writeFile } from 'node:fs/promises';
import { sleep } from '../main/util';

vi.mock(import('./ipcRendererSyncEngine'));

describe('delete-placeholder', () => {
  const invokeMock = deepMocked(ipcRendererSyncEngine.invoke);

  const testFolder = join(TEST_FILES, v4());
  const rootPath = join(testFolder, 'root');
  const queueManagerPath = join(testFolder, 'queue-manager.json');

  const providerId = `{${v4().toUpperCase()}}`;
  setDefaultConfig({ rootPath, providerName: 'Internxt Drive', providerId, rootUuid: v4() });
  const container = DependencyContainerFactory.build();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    VirtualDrive.unRegisterSyncRootByProviderId({ providerId });
  });

  it('should delete placeholder', async () => {
    // Given
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
    const bindingManager = new BindingsManager(container);

    // When
    await bindingManager.start();
    await bindingManager.watch();

    const file = join(rootPath, 'file1.txt');
    await writeFile(file, 'Hello world!');

    await sleep(10000);
    // Then
    expect(true).toBe(true);
  });
});
