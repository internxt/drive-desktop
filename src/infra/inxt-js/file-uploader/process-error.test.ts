import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';
import { LocalSync } from '@/backend/features';
import * as addGeneralIssue from '@/apps/main/background-processes/issues';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('process-error', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const addGeneralIssueMock = partialSpyOn(addGeneralIssue, 'addGeneralIssue');

  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    props = mockProps<typeof processError>({});
  });

  it('should not do anything if aborted', () => {
    // Given
    props.error = new Error('Process killed by user');
    // When
    processError(props);
    // Then
    calls(addItemMock).toHaveLength(0);
  });

  it('should add general issue if max space used', () => {
    // Given
    props.error = new Error('Max space used');
    // When
    processError(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Failed to upload file to the bucket. Not enough space' });
    call(addGeneralIssueMock).toMatchObject({ error: 'NOT_ENOUGH_SPACE' });
    calls(addItemMock).toHaveLength(1);
  });

  it('should return UNKNOWN', () => {
    // Given
    props.error = new Error('Unknown error');
    // When
    processError(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Failed to upload file to the bucket' });
    calls(addItemMock).toHaveLength(1);
  });
});
