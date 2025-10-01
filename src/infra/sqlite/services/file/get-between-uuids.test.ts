import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { Between } from 'typeorm';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('get-between-uuids', () => {
  const findBy = partialSpyOn(fileRepository, 'findBy');
  const fileDecryptNameSpy = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getBetweenUuids>({
    workspaceId: 'workspaceId',
    from: 'uuid1' as FileUuid,
    to: 'uuid2' as FileUuid,
  });

  beforeEach(() => {
    fileDecryptNameSpy.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getBetweenUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toBeDefined();
    call(findBy).toMatchObject({
      workspaceId: 'workspaceId',
      updatedAt: Between('from', 'to'),
    });
  });
});
