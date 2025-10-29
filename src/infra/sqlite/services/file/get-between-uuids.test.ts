import * as fileDecryptNameModule from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { Between } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('get-between-uuids', () => {
  partialSpyOn(fileDecryptNameModule, 'fileDecryptName');
  const findMock = partialSpyOn(fileRepository, 'find');

  const props = mockProps<typeof getBetweenUuids>({
    workspaceId: 'workspaceId',
    firstUuid: 'uuid1' as FileUuid,
    lastUuid: 'uuid2' as FileUuid,
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findMock.mockRejectedValue(new Error());
    // When
    const { error } = await getBetweenUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findMock.mockResolvedValue([]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toBeDefined();
    call(findMock).toMatchObject({
      order: { uuid: 'ASC' },
      where: {
        workspaceId: 'workspaceId',
        status: 'EXISTS',
        uuid: Between('uuid1', 'uuid2'),
      },
    });
  });
});
