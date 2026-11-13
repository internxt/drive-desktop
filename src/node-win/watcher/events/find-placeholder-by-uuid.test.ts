import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as originalFs from '@/infra/file-system/original-fs';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { findPlaceholderByUuid } from './find-placeholder-by-uuid';

describe('find-placeholder-by-uuid', () => {
  const readdirMock = partialSpyOn(originalFs, 'readdir');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const folder = abs('/folder');
  const uuid = 'uuid' as FileUuid;

  it('should return the path of the placeholder with the uuid', async () => {
    // Given
    readdirMock.mockResolvedValue(['file.rfa', 'file.0001.rfa'] as any);
    getFileInfoMock.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: { uuid } } as any);
    // When
    const { data } = await findPlaceholderByUuid({ folder, uuid });
    // Then
    expect(data).toBe(join(folder, 'file.0001.rfa'));
  });

  it('should return undefined when no placeholder has the uuid', async () => {
    // Given
    readdirMock.mockResolvedValue(['file.rfa', 'other.rfa'] as any);
    getFileInfoMock.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: { uuid: 'other' } } as any);
    // When
    const { data, error } = await findPlaceholderByUuid({ folder, uuid });
    // Then
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();
  });

  it('should return an error when the folder cannot be read', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error('EPERM'));
    // When
    const { error } = await findPlaceholderByUuid({ folder, uuid });
    // Then
    expect(error).toBeInstanceOf(Error);
    calls(getFileInfoMock).toHaveLength(0);
  });
});
