import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { recoverySync } from './recovery-sync';
import * as filesRecoverySyncModule from '../files/files-recovery-sync';
import * as foldersRecoverySyncModule from '../folders/folders-recovery-sync';
import * as sleepModule from '@/apps/main/util';

describe('recovery-sync', () => {
  partialSpyOn(sleepModule, 'sleep');
  const filesRecoverySyncMock = partialSpyOn(filesRecoverySyncModule, 'filesRecoverySync');
  const foldersRecoverySyncMock = partialSpyOn(foldersRecoverySyncModule, 'foldersRecoverySync');

  let props: Parameters<typeof recoverySync>[0];

  beforeEach(() => {
    props = mockProps<typeof recoverySync>({
      ctx: { abortController: new AbortController() },
    });
  });

  it('should calls files and folders recovery sync', async () => {
    // When
    await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toHaveLength(1);
    calls(foldersRecoverySyncMock).toHaveLength(1);
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
    filesRecoverySyncMock.mockResolvedValueOnce(Array(1000)).mockResolvedValueOnce(Array(999));
    // When
    await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toMatchObject([{ offset: 0 }, { offset: 1000 }]);
  });
});
