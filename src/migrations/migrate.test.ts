import { electronStore } from '@/apps/main/config';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { migrate } from './migrate';
import { RemoveAntivirusTable } from './v2.5.7/remove-antivirus-table';
import { MoveCheckpointToSqlite } from './v2.6.3/move-checkpoint-to-sqlite';

describe('migrate', () => {
  const getMock = partialSpyOn(electronStore, 'get');
  const setMock = partialSpyOn(electronStore, 'set');
  const removeAntivirusTableMock = partialSpyOn(RemoveAntivirusTable, 'run');
  const moveCheckpointToSqliteMock = partialSpyOn(MoveCheckpointToSqlite, 'run');

  it('should skip migration if store contains keys', async () => {
    // Given
    getMock.mockReturnValue(true);
    // When
    await migrate();
    // Then
    expect(removeAntivirusTableMock).toBeCalledTimes(0);
    expect(moveCheckpointToSqliteMock).toBeCalledTimes(0);
  });

  it('should migrate if store does not contain keys', async () => {
    // Given
    getMock.mockReturnValue(false);
    // When
    await migrate();
    // Then
    expect(setMock).toBeCalledTimes(2);
    expect(removeAntivirusTableMock).toBeCalledTimes(1);
    expect(moveCheckpointToSqliteMock).toBeCalledTimes(1);
  });
});
