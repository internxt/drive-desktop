import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateByUuid } from './update-by-uuid';

describe('update-by-uuid', () => {
  const updateSpy = partialSpyOn(fileRepository, 'update');

  const props = mockProps<typeof updateByUuid>({ payload: {} });

  it('should return NOT_FOUND when no file has been affected', async () => {
    // Given
    updateSpy.mockResolvedValue({ affected: 0 });
    // When
    const { error } = await updateByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    updateSpy.mockRejectedValue(new Error());
    // When
    const { error } = await updateByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return the number of files affected', async () => {
    // Given
    updateSpy.mockResolvedValue({ affected: 1 });
    // When
    const { data } = await updateByUuid(props);
    // Then
    expect(data).toBeDefined();
  });
});
