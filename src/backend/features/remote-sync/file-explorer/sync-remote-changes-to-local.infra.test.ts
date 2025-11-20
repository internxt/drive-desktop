import { createWatcher } from '@/apps/sync-engine/create-watcher';
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

describe('sync-remote-changes-to-local', () => {
  partialSpyOn(onAdd, 'onAdd');
  partialSpyOn(debounceOnRaw, 'debounceOnRaw');
  const onAllMock = partialSpyOn(onAll, 'onAll');

  const providerName = 'Internxt Drive';
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, 'root');
  const filePath = join(rootPath, 'file.txt');
  const rootUuid = v4();
  const providerId = `{${rootUuid.toUpperCase()}}`;
  const virtualDrive = new VirtualDrive({ providerId, rootPath });

  beforeEach(async () => {
    await virtualDrive.createSyncRootFolder();
    virtualDrive.registerSyncRoot({ providerName });
  });

  afterAll(() => {
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('should sync remote changes to local', async () => {
    // Given
    const { watcher } = createWatcher();
    const watcherProps = mockProps<typeof watcher.watchAndWait>({ ctx: { virtualDrive, rootPath } });
    watcher.watchAndWait(watcherProps);
    await sleep(100);

    await writeFile(filePath, 'content');
    virtualDrive.convertToPlaceholder({ path: filePath, placeholderId: 'FILE:uuid' });

    const props = mockProps<typeof syncRemoteChangesToLocal>({
      ctx: { virtualDrive },
      remote: {
        uuid: 'uuid' as FileUuid,
        absolutePath: filePath,
        createdAt: '2000-01-01',
        updatedAt: '2000-01-02',
        size: 1000,
      },
      local: {
        path: filePath,
        stats: { mtime: new Date('2000-01-01'), size: 2000 },
      },
    });

    // When
    await sleep(3000);
    await syncRemoteChangesToLocal(props);
    await sleep(3000);

    // Then
    calls(onAllMock).toStrictEqual([
      { event: 'add', path: filePath },
      { event: 'change', path: filePath },
    ]);

    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Registering sync root', rootPath },
      { msg: 'onReady' },
      { tag: 'SYNC-ENGINE', msg: 'Convert to placeholder', path: filePath, placeholderId: 'FILE:uuid' },
      {
        msg: 'Syncing remote changes to local',
        path: filePath,
        remoteSize: 1000,
        localSize: 2000,
        remoteDate: '2000-01-02T00:00:00.000Z',
        localDate: '2000-01-01T00:00:00.000Z',
      },
      { msg: 'Deleted old local file to prepare for remote sync', path: filePath },
      { tag: 'SYNC-ENGINE', msg: 'Create file placeholder', path: filePath },
      { msg: 'File successfully synced from remote to local', path: filePath, newSize: 1000 },
    ]);
  });
});
