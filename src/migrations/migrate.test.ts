import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { migrate } from './migrate';
import { AddUserUuidToDatabase } from './v2.5.1/add-user-uuid-to-database';
import { RemoveAntivirusTable } from './v2.5.7/remove-antivirus-table';
import { electronStore } from '@/apps/main/config';
import { MoveCheckpointToSqlite } from './v2.6.3/move-checkpoint-to-sqlite';

describe('migrate', () => {
  const getMock = partialSpyOn(electronStore, 'get');
  const setMock = partialSpyOn(electronStore, 'set');
  const addUserUuidToDatabaseMock = partialSpyOn(AddUserUuidToDatabase, 'run');
  const removeAntivirusTableMock = partialSpyOn(RemoveAntivirusTable, 'run');
  const moveCheckpointToSqliteMock = partialSpyOn(MoveCheckpointToSqlite, 'run');

  it('should skip migration if store contains keys', async () => {
    // Given
    getMock.mockReturnValue(true);
    // When
    await migrate();
    // Then
    expect(addUserUuidToDatabaseMock).toBeCalledTimes(0);
    expect(removeAntivirusTableMock).toBeCalledTimes(0);
    expect(moveCheckpointToSqliteMock).toBeCalledTimes(0);
  });

  it('should migrate if store does not contain keys', async () => {
    // Given
    getMock.mockReturnValue(false);
    // When
    await migrate();
    // Then
    expect(setMock).toBeCalledTimes(3);
    expect(addUserUuidToDatabaseMock).toBeCalledTimes(1);
    expect(removeAntivirusTableMock).toBeCalledTimes(1);
    expect(moveCheckpointToSqliteMock).toBeCalledTimes(1);
  });
});
