import { folderRepository } from '../drive-folder';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { Between } from 'typeorm';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as folderDecryptNameModule from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

describe('get-between-uuids', () => {
  partialSpyOn(folderDecryptNameModule, 'folderDecryptName');
  const findMock = partialSpyOn(folderRepository, 'find');

  const props = mockProps<typeof getBetweenUuids>({
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    firstUuid: 'uuid1' as FolderUuid,
    lastUuid: 'uuid2' as FolderUuid,
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findMock.mockRejectedValue(new Error());
    // When
    const { error } = await getBetweenUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folders', async () => {
    // Given
    findMock.mockResolvedValue([]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toBeDefined();
    call(findMock).toMatchObject({
      order: { uuid: 'ASC' },
      where: {
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        status: 'EXISTS',
        uuid: Between('uuid1', 'uuid2'),
      },
    });
  });
});
