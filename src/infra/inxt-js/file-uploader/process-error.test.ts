import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';
import { LocalSync } from '@/backend/features';

describe('process-error', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    props = mockProps<typeof processError>({});
  });

  it('should return ABORTED', () => {
    // Given
    props.err = new Error('Process killed by user');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('ABORTED');
    expect(addItemMock).toBeCalledTimes(0);
  });

  it('should return NOT_ENOUGH_SPACE', () => {
    // Given
    props.err = new Error('Max space used');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('NOT_ENOUGH_SPACE');
    expect(addItemMock).toBeCalledTimes(1);
  });

  it('should return UNKNOWN', () => {
    // Given
    props.err = new Error('Unknown error');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('UNKNOWN');
    expect(addItemMock).toBeCalledTimes(1);
  });
});
