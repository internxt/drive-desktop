import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { migrate } from './migrate';
import { AddUserUuidToDatabase } from './v2.5.1/add-user-uuid-to-database';
import { MoveCheckpointToLokijs } from './v2.5.6/move-checkpoint-to-lokijs';
import Store from 'electron-store';
import { RemoveAntivirusTable } from './v2.5.7/remove-antivirus-table';

vi.mock(import('electron-store'));

describe('migrate', () => {
  const StoreMock = vi.mocked(Store, true);
  const addUserUuidToDatabaseMock = partialSpyOn(AddUserUuidToDatabase, 'run');
  const moveCheckpointToLokiksMock = partialSpyOn(MoveCheckpointToLokijs, 'run');
  const removeAntivirusTableMock = partialSpyOn(RemoveAntivirusTable, 'run');

  it('should skip migration if store contains keys', async () => {
    // Given
    StoreMock.prototype.get.mockReturnValue(true);
    // When
    await migrate();
    // Then
    expect(addUserUuidToDatabaseMock).toBeCalledTimes(0);
    expect(moveCheckpointToLokiksMock).toBeCalledTimes(0);
    expect(removeAntivirusTableMock).toBeCalledTimes(0);
  });

  it('should migrate if store does not contain keys', async () => {
    // Given
    StoreMock.prototype.get.mockReturnValue(false);
    // When
    await migrate();
    // Then
    expect(StoreMock.prototype.set).toBeCalledTimes(3);
    expect(addUserUuidToDatabaseMock).toBeCalledTimes(1);
    expect(moveCheckpointToLokiksMock).toBeCalledTimes(1);
    expect(removeAntivirusTableMock).toBeCalledTimes(1);
  });
});
