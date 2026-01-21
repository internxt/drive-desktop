import { folderRepository } from '../drive-folder';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdateBatch } from './create-or-update-batch';

describe('create-or-update-batch', () => {
  const upsertMock = partialSpyOn(folderRepository, 'upsert');

  const folders = Array.from({ length: 450 }, () => ({}));

  let props: Parameters<typeof createOrUpdateBatch>[0];

  beforeEach(() => {
    upsertMock.mockResolvedValue({});

    props = mockProps<typeof createOrUpdateBatch>({ folders });
  });

  it('should return empty if no folders', async () => {
    // Given
    props.folders = [];
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

  it('should return folders', async () => {
    // When
    const { data } = await createOrUpdateBatch(props);
    // Then
    expect(data).toHaveLength(450);
    calls(upsertMock).toHaveLength(5);
  });
});
