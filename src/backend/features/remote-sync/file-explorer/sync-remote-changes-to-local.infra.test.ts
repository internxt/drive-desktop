import { createWatcher } from '@/apps/sync-engine/create-watcher';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import VirtualDrive from '@/node-win/virtual-drive';
import { v4 } from 'uuid';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { join } from 'path';
import { getMockCalls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { writeFile } from 'fs/promises';
import { PinState } from '@/node-win/types/placeholder.type';
import { mockDeep } from 'vitest-mock-extended';
import { TWatcherCallbacks } from '@/node-win/watcher/watcher';
import { sleep } from '@/apps/main/util';
import * as onAll from '@/node-win/watcher/events/on-all.service';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as onAdd from '@/node-win/watcher/events/on-add.service';
import * as debounceOnRaw from '@/node-win/watcher/events/debounce-on-raw';

describe('sync-remote-changes-to-local', () => {
  partialSpyOn(onAdd, 'onAdd');
  partialSpyOn(debounceOnRaw, 'debounceOnRaw');
  const onAllMock = partialSpyOn(onAll, 'onAll');

  const providerName = 'Internxt Drive';
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, 'root') as AbsolutePath;
  const filePath = join(rootPath, 'file.txt');
  const rootUuid = v4();
  const providerId = `{${rootUuid.toUpperCase()}}`;
  const virtualDrive = new VirtualDrive({ loggerPath: '', providerId, rootPath });
  const callbacks = mockDeep<Callbacks>();

  beforeEach(() => {
    virtualDrive.registerSyncRoot({ providerName });
    virtualDrive.connectSyncRoot({ callbacks });
  });

  afterAll(() => {
    virtualDrive.disconnectSyncRoot();
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('should sync remote changes to local', async () => {
    // Given
    const watcherCallbacks = mockDeep<TWatcherCallbacks>();
    const createWatcherProps = mockProps<typeof createWatcher>({ ctx: { virtualDrive }, watcherCallbacks });
    const { watcher } = createWatcher(createWatcherProps);
    const watcherProps = mockProps<typeof watcher.watchAndWait>({ ctx: { virtualDrive } });
    watcher.watchAndWait(watcherProps);
    await sleep(100);

    await writeFile(filePath, 'content');
    virtualDrive.convertToPlaceholder({ itemPath: filePath, id: 'FILE:uuid' });
    let status = virtualDrive.getPlaceholderState({ path: filePath });
    expect(status.pinState).toBe(PinState.AlwaysLocal);

    const props = mockProps<typeof syncRemoteChangesToLocal>({
      virtualDrive,
      remote: {
        uuid: 'uuid' as FileUuid,
        path: createRelativePath('file.txt'),
        createdAt: '2000-01-01',
        updatedAt: '2000-01-02',
        size: 1000,
      },
      local: {
        absolutePath: filePath as AbsolutePath,
        stats: { mtime: new Date('2000-01-01'), size: 2000 },
      },
    });

    // When
    await sleep(3000);
    await syncRemoteChangesToLocal(props);
    await sleep(3000);

    // Then
    status = virtualDrive.getPlaceholderState({ path: filePath });
    expect(status.pinState).toBe(PinState.OnlineOnly);
    expect(getMockCalls(onAllMock)).toStrictEqual([
      { event: 'add', path: filePath },
      { event: 'change', path: filePath },
    ]);

    expect(getMockCalls(loggerMock.debug)).toStrictEqual([
      { msg: 'Registering sync root', syncRootPath: rootPath },
      { msg: 'connectSyncRoot', connectionKey: { hr: 0, connectionKey: expect.any(String) } },
      { msg: 'onReady' },
      { msg: 'Convert to placeholder succeeded', itemPath: filePath, id: 'FILE:uuid' },
      {
        tag: 'SYNC-ENGINE',
        msg: 'Syncing remote changes to local',
        path: '/file.txt',
        remoteSize: 1000,
        localSize: 2000,
        remoteDate: '2000-01-02T00:00:00.000Z',
        localDate: '2000-01-01T00:00:00.000Z',
      },
      { tag: 'SYNC-ENGINE', msg: 'Deleted old local file to prepare for remote sync', path: '/file.txt' },
      { tag: 'SYNC-ENGINE', msg: 'Creating file placeholder', itemPath: '/file.txt' },
      { tag: 'SYNC-ENGINE', msg: 'File successfully synced from remote to local', path: '/file.txt', newSize: 1000 },
    ]);
  });
});
