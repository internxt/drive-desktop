import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { v4 } from 'uuid';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { stat, writeFile } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Addon } from '@/node-win/addon-wrapper';
import { setupWatcher } from '@/node-win/watcher/tests/watcher.helper.test';

describe('sync-remote-changes-to-local', () => {
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

    const props = mockProps<typeof syncRemoteChangesToLocal>({
      remote: {
        uuid: 'uuid' as FileUuid,
        absolutePath: path,
        updatedAt: '2000-01-02',
        size: 1000,
      },
      local: {
        path,
        stats: { mtime: new Date('2000-01-01'), size: 7 },
      },
    });

    // When
    await sleep(100);
    await syncRemoteChangesToLocal(props);
    await sleep(100);

    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', rootPath },
      { msg: 'Setup watcher' },
      {
        msg: 'Sync remote changes to local',
        path,
        remoteSize: 1000,
        localSize: 7,
        remoteDate: new Date('2000-01-02T00:00:00.000Z'),
        localDate: new Date('2000-01-01T00:00:00.000Z'),
      },
    ]);

    const stats = await stat(path);
    const fileInfo = await Addon.getPlaceholderState({ path });
    expect(stats.size).toBe(1000);
    expect(fileInfo.onDiskSize).toBe(0);
  });
});
