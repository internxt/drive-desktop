import { folderRepository } from '../drive-folder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import * as folderDecryptName from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

describe('create-or-update', () => {
  const saveMock = partialSpyOn(folderRepository, 'save');
  partialSpyOn(folderDecryptName, 'folderDecryptName');

  const props = mockProps<typeof createOrUpdate>({});

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    saveMock.mockRejectedValue(new Error());
    // When
    const { error } = await createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folder', async () => {
    // Given
    saveMock.mockResolvedValue({});
    // When
    const { data } = await createOrUpdate(props);
    // Then
    expect(data).toBeDefined();
  });
});
