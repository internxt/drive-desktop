import { existsSync, renameSync } from 'node:fs';
import { migrateSyncRoot } from './migrate-sync-root';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { configStore } from '../config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

vi.mock(import('node:fs'));

describe('migrate-old-sync-root', () => {
  const existsSyncMock = vi.mocked(existsSync);
  const renameSyncMock = vi.mocked(renameSync);
  const setMock = partialSpyOn(configStore, 'set');

  const props = mockProps<typeof migrateSyncRoot>({ newSyncRoot: 'newSyncRoot' as AbsolutePath });

  afterEach(() => {
    call(setMock).toStrictEqual(['syncRoot', 'newSyncRoot']);
  });

  it('should skip if new sync root folder already exists', () => {
    // Given
    existsSyncMock.mockReturnValueOnce(true);
    // When
    migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toContainEqual({ msg: 'New sync root already exists, skiping' });
  });

  it('should set a new syncRoot when the user changes the root', () => {
    // Given
    existsSyncMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    // When
    migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate sync root' }, { msg: 'Migrate old sync root' }]);
    calls(renameSyncMock).toHaveLength(1);
  });

  it('should set a new syncRoot when the user changes the root', () => {
    // Given
    existsSyncMock.mockReturnValue(false);
    // When
    migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate sync root' }, { msg: 'Old sync root does not exist, skiping' }]);
  });
});
