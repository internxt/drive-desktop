import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { onAllMock, setupWatcher } from '@/node-win/watcher/tests/watcher.helper.test';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { deleteItemPlaceholder } from './delete-item-placeholder';
import { call, calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { mkdir, writeFile } from 'node:fs/promises';
import { PinState } from '@/node-win/types/placeholder.type';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { sleep } from '@/apps/main/util';

describe('delete-item-placeholder', () => {
  const providerName = 'Internxt Drive';
  const providerId = v4();
  const rootPath = join(TEST_FILES, v4());
  const path = join(rootPath, 'file.txt');
  const uuid = 'uuid' as FileUuid;

  let props: Parameters<typeof deleteItemPlaceholder>[0];

  beforeEach(async () => {
    await mkdir(rootPath);
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });

    props = mockProps<typeof deleteItemPlaceholder>({
      type: 'file',
      locals: new Map([[uuid, { path }]]),
      remote: { uuid, absolutePath: 'other.txt' as AbsolutePath },
    });
  });

  afterEach(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should revert placeholder if local and remote paths does not match', async () => {
    // Given
    await writeFile(path, 'content');
    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${uuid}` });
    await Addon.setPinState({ path, pinState: PinState.AlwaysLocal });
    await setupWatcher(rootPath);
    // When
    await deleteItemPlaceholder(props);
    await sleep(1000);
    // Then
    calls(loggerMock.debug).toStrictEqual([{ msg: 'Register sync root', rootPath }, { msg: 'onReady' }]);
    call(loggerMock.error).toMatchObject({ msg: 'Path does not match when removing placeholder' });
    call(onAllMock).toMatchObject({ event: 'change', path, stats: { size: 7 } });

    const { error } = await NodeWin.getFileInfo({ path });
    expect(error?.code).toBe('NOT_A_PLACEHOLDER');
  });
});
