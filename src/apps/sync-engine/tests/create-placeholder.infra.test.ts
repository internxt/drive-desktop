import { writeFile } from 'node:fs/promises';
import { loggerMock, TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { v4 } from 'uuid';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { initWatcher } from '@/node-win/watcher/watcher';

describe('create-placeholder', () => {
  const createFileMock = partialSpyOn(Sync.Actions, 'createFile');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');

  const providerName = 'Internxt Drive';
  const providerId = v4();
  const rootPath = join(TEST_FILES, v4());
  const file = join(rootPath, 'file.txt');

  beforeEach(async () => {
    createFileMock.mockResolvedValue({ uuid: v4() as FileUuid });
    getByNameMock.mockResolvedValue({});

    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should create placeholder', async () => {
    // Given
    const watcherProps = mockProps<typeof initWatcher>({ ctx: { rootPath } });
    initWatcher(watcherProps);
    await sleep(100);

    // When
    await writeFile(file, 'content');
    await sleep(2200);

    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', providerId, rootPath },
      { msg: 'Setup watcher' },
      { msg: 'Watcher event', event: { action: 'update', size: 7 } },
      { msg: 'Watcher event', event: { action: 'update', size: 7 } },
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
  });
});
