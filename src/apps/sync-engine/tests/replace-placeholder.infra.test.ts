import { randomUUID } from 'node:crypto';
import { rename, utimes, writeFile } from 'node:fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { sleep } from '@/apps/main/util';
import * as waitForLocalFile from '@/backend/features/drive/actions/services/wait-for-local-file';
import { Sync } from '@/backend/features/sync';
import { WaitUntilReadyError } from '@/backend/features/sync/actions/services/wait-until-ready';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState } from '@/node-win/types/placeholder.type';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { initWatcher } from '@/node-win/watcher/watcher';

describe('replace-placeholder', () => {
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const waitForLocalFileMock = partialSpyOn(waitForLocalFile, 'waitForLocalFile');

  const providerName = 'Internxt Drive';
  const providerId = randomUUID();
  const rootPath = join(TEST_FILES, randomUUID());
  const file = join(rootPath, 'file.docx');
  const uuid = randomUUID() as FileUuid;

  async function saveLikeWord() {
    const newVersion = join(rootPath, '~WRD0001.tmp');
    await writeFile(newVersion, 'new version');
    await rename(file, join(rootPath, '~WRL0001.tmp'));
    await rename(newVersion, file);
    await sleep(2200);
  }

  beforeEach(async () => {
    getByNameMock.mockResolvedValue({ data: { uuid } });

    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
    await writeFile(file, 'old version');
    const lastSave = new Date(Date.now() - 60_000);
    await utimes(file, lastSave, lastSave);
    await Addon.convertToPlaceholder({ path: file, placeholderId: `FILE:${uuid}`, markInSync: true });

    const watcherProps = mockProps<typeof initWatcher>({
      ctx: { rootPath, rootUuid: randomUUID() as FolderUuid, abortController: new AbortController() },
    });
    initWatcher(watcherProps);
    await sleep(100);
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should keep a saved file not in sync while its upload fails', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValue({ data: true });
    replaceFileMock.mockResolvedValue(undefined);
    // When
    await saveLikeWord();
    // Then
    const state = await Addon.getPlaceholderState({ path: file });
    expect(state).toMatchObject({ uuid, inSyncState: InSyncState.NotSync });
  });

  it('should retry a saved file that was not ready', async () => {
    // Given
    waitForLocalFileMock.mockResolvedValue({ error: new WaitUntilReadyError('IDLE_TIMEOUT') });
    replaceFileMock.mockResolvedValue({ uuid });
    await saveLikeWord();
    calls(replaceFileMock).toHaveLength(0);
    // When
    const { retry } = waitForLocalFileMock.mock.calls[0][0];
    waitForLocalFileMock.mockResolvedValue({ data: true });
    await retry();
    // Then
    calls(replaceFileMock).toMatchObject([{ path: file, uuid }]);
  });
});
