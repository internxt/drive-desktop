import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByName } from './get-by-name';

describe('get-by-name', () => {
  const findOneSpy = partialSpyOn(fileRepository, 'findOne');

  const props = mockProps<typeof getByName>({ nameWithExtension: 'file.txt' });

  it('should return NOT_FOUND when file is not found', async () => {
    // Given
    findOneSpy.mockResolvedValue(null);
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findOneSpy.mockRejectedValue(new Error());
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return file', async () => {
    // Given
    findOneSpy.mockResolvedValue({ plainName: 'name' });
    // When
    const { data } = await getByName(props);
    // Then
    expect(data).toBeDefined();
    expect(findOneSpy).toBeCalledWith({
      where: expect.objectContaining({
        plainName: 'file',
        type: 'txt',
        status: 'EXISTS',
      }),
    });
  });
});
