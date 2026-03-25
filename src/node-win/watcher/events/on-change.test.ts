import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { Drive } from '@/backend/features/drive';
import * as moveFile from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { onChange } from './on-change';

describe('on-change', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const throttleHydrateMock = partialSpyOn(throttleHydrate, 'throttleHydrate');
  const replaceFileMock = partialSpyOn(Drive.Actions, 'replaceFile');
  const createFileMock = partialSpyOn(Drive.Actions, 'createFile');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const moveFileMock = partialSpyOn(moveFile, 'moveFile');

  const path = abs('/file.txt');
  let props: TestProps<typeof onChange>;

  beforeEach(() => {
    props = {
      ctx: { logger: loggerMock },
      path,
    };
  });

  it('should replace file when file is in sqlite', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({});
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    getByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onChange(props as any);
    // Then
    call(convertToPlaceholderMock).toStrictEqual({ path, placeholderId: 'FILE:uuid' });
    call(replaceFileMock).toMatchObject({ path, uuid: 'uuid' });
  });

  it('should create file when file is not in sqlite', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({});
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    getByNameMock.mockResolvedValue({});
    // When
    await onChange(props as any);
    // Then
    call(createFileMock).toMatchObject({ path, parentUuid: 'parentUuid' });
  });

  it('should replace file when file is modified and not in sync', async () => {
    // Given
    props.event = { mtimeMs: Date.now() };
    getFileInfoMock.mockResolvedValue({ data: { inSyncState: InSyncState.NotSync } });
    // When
    await onChange(props as any);
    // Then
    call(replaceFileMock).toMatchObject({ path });
  });

  it('should hydrate when ctime is modified and disk size is 0', async () => {
    // Given
    props.event = { ctimeMs: Date.now() };
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.AlwaysLocal, onDiskSize: 0 } });
    // When
    await onChange(props as any);
    // Then
    call(throttleHydrateMock).toMatchObject({ path });
  });

  it('should dehydrate when ctime is modified and disk size is not 0', async () => {
    // Given
    props.event = { ctimeMs: Date.now() };
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.OnlineOnly, onDiskSize: 1 } });
    // When
    await onChange(props as any);
    // Then
    calls(replaceFileMock).toHaveLength(0);
    calls(throttleHydrateMock).toHaveLength(0);
    call(handleDehydrateMock).toMatchObject({ path });
  });

  it('should dehydrate when ctime is modified and size is 0', async () => {
    // Given
    props.event = { ctimeMs: Date.now(), size: 0 };
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.OnlineOnly } });
    // When
    await onChange(props as any);
    // Then
    call(handleDehydrateMock).toMatchObject({ path });
  });

  it('should move when ctime is modified and file is not in sync', async () => {
    // Given
    props.event = { ctimeMs: Date.now() };
    getFileInfoMock.mockResolvedValue({ data: { inSyncState: InSyncState.NotSync } });
    // When
    await onChange(props as any);
    // Then
    call(moveFileMock).toMatchObject({ path });
  });
});
