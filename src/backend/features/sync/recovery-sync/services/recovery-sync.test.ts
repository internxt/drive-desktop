import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { recoverySync } from './recovery-sync';
import * as filesRecoverySyncModule from './files-recovery-sync';
import * as sleepModule from '@/apps/main/util';

describe('recovery-sync', () => {
  partialSpyOn(sleepModule, 'sleep');
  const filesRecoverySyncMock = partialSpyOn(filesRecoverySyncModule, 'filesRecoverySync');

  let props: Parameters<typeof recoverySync>[0];

  beforeEach(() => {
    props = mockProps<typeof recoverySync>({
      ctx: { abortController: new AbortController() },
    });
  });

  it('should not call recovery sync if it is aborted', async () => {
    // Given
    props.ctx.abortController.abort();
    // When
    await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toHaveLength(0);
  });

  it('should repeat if we have more files', async () => {
    // Given
    filesRecoverySyncMock.mockResolvedValueOnce(Array(50)).mockResolvedValueOnce(Array(49));
    // When
    await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toMatchObject([{ offset: 0 }, { offset: 50 }]);
  });
});
