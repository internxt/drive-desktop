import { loggerMock, TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { writeFile } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as persistFile from '@/infra/drive-server-wip/out/ipc-main';
import * as onAll from '@/node-win/watcher/events/on-all.service';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { Addon } from '@/node-win/addon-wrapper';
import { initWatcher } from '@/node-win/watcher/watcher';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('@/infra/inxt-js/file-uploader/environment-file-uploader'));

describe('create-placeholder', () => {
  const onAllMock = partialSpyOn(onAll, 'onAll');
  const persistFileMock = partialSpyOn(persistFile, 'persistFile');
  const uploadContentsMock = partialSpyOn(EnvironmentFileUploader, 'run');

  const providerName = 'Internxt Drive';
  const providerId = v4();
  const rootPath = join(TEST_FILES, v4());
  const file = join(rootPath, 'file.txt');

  beforeEach(async () => {
    uploadContentsMock.mockResolvedValueOnce({ data: 'contentsId' as ContentsId });

    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should create placeholder', async () => {
    // Given
    persistFileMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    const watcherProps = mockProps<typeof initWatcher>({ ctx: { rootPath } });
    initWatcher(watcherProps);
    await sleep(100);

    // When
    await writeFile(file, 'content');
    await sleep(5000);

    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(loggerMock.debug).toStrictEqual([
      { tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: 'NON_EXISTS' },
      { msg: 'Register sync root', rootPath },
      { msg: 'onReady' },
      { msg: 'Create file', path: file },
      { msg: 'File uploaded', path: file, contentsId: 'contentsId', size: 7 },
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
      { event: 'add', path: file, stats: { size: 7 } },
      { event: 'change', path: file, stats: { size: 7 } },
    ]);
  });
});
