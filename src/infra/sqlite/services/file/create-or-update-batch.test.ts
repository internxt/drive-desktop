import { fileRepository } from '../drive-file';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdateBatch } from './create-or-update-batch';

describe('create-or-update-batch', () => {
  const upsertMock = partialSpyOn(fileRepository, 'upsert');

  const files = Array.from({ length: 450 }, () => ({}));

  let props: Parameters<typeof createOrUpdateBatch>[0];

  beforeEach(() => {
    upsertMock.mockResolvedValue({});

    props = mockProps<typeof createOrUpdateBatch>({ files });
  });

  it('should return empty if no files', async () => {
    // Given
    props.files = [];
    // When
    const { data } = await createOrUpdateBatch(props);
    // Then
    expect(data).toHaveLength(0);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    upsertMock.mockRejectedValue(new Error());
    // When
    const { error } = await createOrUpdateBatch(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // When
    const { data } = await createOrUpdateBatch(props);
    // Then
    expect(data).toHaveLength(450);
    calls(upsertMock).toHaveLength(5);
  });
});
