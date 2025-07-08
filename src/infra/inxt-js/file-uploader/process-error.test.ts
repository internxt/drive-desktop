import { mockProps } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';
import { mockDeep } from 'vitest-mock-extended';
import { FileUploaderCallbacks } from './file-uploader';

describe('process-error', () => {
  const callbacks = mockDeep<FileUploaderCallbacks>();
  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    vi.clearAllMocks();

    props = mockProps<typeof processError>({ callbacks });
  });

  it('should return KILLED_BY_USER', () => {
    // Given
    props.err = new Error('Process killed by user');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('KILLED_BY_USER');
    expect(callbacks.onError).toBeCalledTimes(0);
  });

  it('should return NOT_ENOUGH_SPACE', () => {
    // Given
    props.err = new Error('Max space used');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('NOT_ENOUGH_SPACE');
    expect(callbacks.onError).toBeCalledTimes(1);
  });

  it('should return UNKNOWN', () => {
    // Given
    props.err = new Error('Unknown error');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('UNKNOWN');
    expect(callbacks.onError).toBeCalledTimes(1);
  });
});
