import { folderRepository } from '../drive-folder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import * as folderDecryptName from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

describe('create-or-update', () => {
  const upsertMock = partialSpyOn(folderRepository, 'upsert');
  partialSpyOn(folderDecryptName, 'folderDecryptName');

  const props = mockProps<typeof createOrUpdate>({ folder: {} });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    upsertMock.mockRejectedValue(new Error());
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return file', async () => {
    // Given
    upsertMock.mockResolvedValue({});
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(res).toBeDefined();
  });
});
