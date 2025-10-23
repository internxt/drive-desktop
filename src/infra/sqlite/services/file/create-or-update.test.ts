import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';

describe('create-or-update', () => {
  const upsertMock = partialSpyOn(fileRepository, 'upsert');
  const fileDecryptNameSpy = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof createOrUpdate>({});

  beforeEach(() => {
    fileDecryptNameSpy.mockImplementation(({ encryptedName }) => ({
      name: encryptedName,
      nameWithExtension: encryptedName,
    }));
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    upsertMock.mockRejectedValue(new Error());
    // When
    const { error } = await createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return file', async () => {
    // Given
    upsertMock.mockResolvedValue({});
    // When
    const { data } = await createOrUpdate(props);
    // Then
    expect(data).toBeDefined();
  });
});
