import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';
import { LocalSync } from '@/backend/features';
import * as addGeneralIssue from '@/apps/main/background-processes/issues';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as sleep from '@/apps/main/util';

describe('process-error', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const addGeneralIssueMock = partialSpyOn(addGeneralIssue, 'addGeneralIssue');
  const sleepMock = partialSpyOn(sleep, 'sleep');

  const retryFn = vi.fn();
  const sleepMs = 5000;
  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    props = mockProps<typeof processError>({ retryFn, sleepMs });
  });

  it('should not do anything if aborted', async () => {
    // Given
    props.error = new DOMException('The operation was aborted', 'AbortError');
    // When
    await processError(props);
    // Then
    calls(addItemMock).toHaveLength(0);
  });

  it('should add general issue if max space used', async () => {
    // Given
    props.error = new Error('Max space used');
    // When
    await processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NOT_ENOUGH_SPACE' });
  });

  it('should retry in case of server unavailable', async () => {
    // Given
    props.error = new Error('Server unavailable');
    // When
    await processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NETWORK_CONNECTIVITY_ERROR' });
    call(sleepMock).toStrictEqual(sleepMs);
  });

  it('should handle unknown error', async () => {
    // Given
    props.error = 'unknown';
    // When
    await processError(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Failed to upload file to the bucket' });
    call(addItemMock).toMatchObject({ action: 'UPLOAD_ERROR' });
  });
});
