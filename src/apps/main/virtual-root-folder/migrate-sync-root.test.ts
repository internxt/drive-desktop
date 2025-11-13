import { existsSync } from 'node:fs';
import { migrateSyncRoot } from './migrate-sync-root';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { electronStore } from '../config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { rename } from 'node:fs/promises';

vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));

describe('migrate-sync-root', () => {
  const existsSyncMock = vi.mocked(existsSync);
  const renameMock = vi.mocked(rename);
  const setMock = partialSpyOn(electronStore, 'set');

  const props = mockProps<typeof migrateSyncRoot>({ newSyncRoot: 'newSyncRoot' as AbsolutePath });

  afterEach(() => {
    call(setMock).toStrictEqual(['syncRoot', 'newSyncRoot']);
  });

  it('should skip if new sync root folder already exists', async () => {
    // Given
    existsSyncMock.mockReturnValueOnce(true);
    // When
    await migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate sync root' }, { msg: 'New sync root already exists, skiping' }]);
  });

  it('should set a new syncRoot when the user changes the root', async () => {
    // Given
    existsSyncMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    // When
    await migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate sync root' }, { msg: 'Migrate sync root' }]);
    calls(renameMock).toHaveLength(1);
  });

  it('should set a new syncRoot when the user changes the root', async () => {
    // Given
    existsSyncMock.mockReturnValue(false);
    // When
    await migrateSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate sync root' }, { msg: 'Old sync root does not exist, skiping' }]);
  });
});
