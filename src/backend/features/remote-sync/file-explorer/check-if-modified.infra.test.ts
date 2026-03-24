import { stat, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { VirtualDrive } from '@/node-win/virtual-drive';
import * as onChange from '@/node-win/watcher/events/on-change';
import { setupWatcher } from '@/node-win/watcher/tests/watcher.helper.test';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { checkIfModified } from './check-if-modified';

describe('check-if-modified', () => {
  const onChangeMock = partialSpyOn(onChange, 'onChange');

  const providerName = 'Internxt Drive';
  const providerId = v4();
  const rootPath = join(TEST_FILES, v4());
  const path = join(rootPath, 'file.txt');

  beforeEach(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should sync remote changes to local', async () => {
    // Given
    await setupWatcher(rootPath);
    await writeFile(path, 'content');
    await Addon.convertToPlaceholder({ path, placeholderId: 'FILE:uuid' });

    const props = mockProps<typeof checkIfModified>({
      isFirstExecution: false,
      remote: {
        uuid: 'uuid' as FileUuid,
        absolutePath: path,
        updatedAt: '2000-01-02',
        size: 14,
      },
      local: {
        path,
        stats: { mtime: new Date('2000-01-01'), size: 7 },
      },
    });

    // When
    await sleep(100);
    await checkIfModified(props);
    await sleep(2200);

    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', providerId, rootPath },
      { msg: 'Setup watcher' },
      { msg: 'Watcher event', event: { action: 'create', size: 0 } },
      { msg: 'Watcher event', event: { action: 'update', size: 7 } },
      { msg: 'Watcher event', event: { action: 'update', size: 7 } },
      {
        msg: 'Sync remote changes to local',
        path,
        remoteSize: 14,
        localSize: 7,
        remoteDate: new Date('2000-01-02T00:00:00.000Z'),
        localDate: new Date('2000-01-01T00:00:00.000Z'),
      },
      { msg: 'Watcher event', event: { action: 'update', size: 14 } },
      { msg: 'Watcher event', event: { action: 'update', size: 14 } },
      { msg: 'Watcher event', event: { action: 'update', size: 14 } },
    ]);

    const stats = await stat(path);
    const fileInfo = await Addon.getPlaceholderState({ path });
    expect(stats.size).toBe(14);
    expect(fileInfo.onDiskSize).toBe(0);
    calls(onChangeMock).toMatchObject([{ event: { action: 'update', size: 7 } }, { event: { action: 'update', size: 14 } }]);
  });
});
