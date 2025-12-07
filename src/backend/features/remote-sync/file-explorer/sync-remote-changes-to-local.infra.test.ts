import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { v4 } from 'uuid';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { writeFile } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';
import * as onAll from '@/node-win/watcher/events/on-all.service';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as onAdd from '@/node-win/watcher/events/on-add.service';
import * as debounceOnRaw from '@/node-win/watcher/events/debounce-on-raw';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';

describe('sync-remote-changes-to-local', () => {
  partialSpyOn(onAdd, 'onAdd');
  partialSpyOn(debounceOnRaw, 'debounceOnRaw');
  const onAllMock = partialSpyOn(onAll, 'onAll');

  const providerName = 'Internxt Drive';
  const providerId = `{${v4().toUpperCase()}}`;
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
    const watcherProps = mockProps<typeof initWatcher>({
      ctx: { rootPath },
      options: { awaitWriteFinish: false, interval: 100 },
    });
    initWatcher(watcherProps);
    await sleep(100);

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
    await sleep(200);
    await syncRemoteChangesToLocal(props);
    await sleep(200);

    // Then
    calls(onAllMock).toMatchObject([
      { event: 'add', path, stats: { size: 7 } },
      { event: 'change', path, stats: { size: 7 } },
      { event: 'change', path, stats: { size: 1000 } },
    ]);

    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', rootPath },
      { msg: 'onReady' },
      {
        msg: 'Sync remote changes to local',
        path,
        remoteSize: 1000,
        localSize: 7,
        remoteDate: new Date('2000-01-02T00:00:00.000Z'),
        localDate: new Date('2000-01-01T00:00:00.000Z'),
      },
    ]);
  });
});
