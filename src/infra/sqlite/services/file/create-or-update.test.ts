import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';

describe('create-or-update', () => {
  const upsertMock = partialSpyOn(fileRepository, 'upsert');

  const props = mockProps<typeof createOrUpdate>({ file: {} });

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
