import { loggerMock, TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { writeFile } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as onAll from '@/node-win/watcher/events/on-all.service';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Sync } from '@/backend/features/sync';

describe('create-placeholder', () => {
  const onAllMock = partialSpyOn(onAll, 'onAll');
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');

  const providerName = 'Internxt Drive';
  const providerId = v4();
  const rootPath = join(TEST_FILES, v4());
  const file = join(rootPath, 'file.txt');

  beforeEach(async () => {
    createFileMock.mockResolvedValue({ uuid: 'uuid' as FileUuid });

    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should create placeholder', async () => {
    // Given
    const watcherProps = mockProps<typeof initWatcher>({ ctx: { rootPath } });
    await initWatcher(watcherProps);
    await sleep(100);

    // When
    await writeFile(file, 'content');
    await sleep(3000);

    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', rootPath },
      {
        msg: 'On change event',
        path: file,
        pinState: PinState.Unspecified,
        inSyncState: InSyncState.Sync,
        size: 7,
        onDiskSize: 7,
        isChanged: true,
        isModified: true,
      },
    ]);

    calls(onAllMock).toMatchObject([
      { event: 'create', path: file },
      { event: 'update', path: file },
    ]);
  });
});
