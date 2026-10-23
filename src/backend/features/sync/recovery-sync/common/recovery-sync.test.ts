import * as sleepModule from '@/apps/main/util';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as filesRecoverySyncModule from '../files/files-recovery-sync';
import * as foldersRecoverySyncModule from '../folders/folders-recovery-sync';
import { recoverySync } from './recovery-sync';

describe('recovery-sync', () => {
  const sleepMock = partialSpyOn(sleepModule, 'sleep');
  const filesRecoverySyncMock = partialSpyOn(filesRecoverySyncModule, 'filesRecoverySync');
  const foldersRecoverySyncMock = partialSpyOn(foldersRecoverySyncModule, 'foldersRecoverySync');

  let props: Parameters<typeof recoverySync>[0];

  beforeEach(() => {
    filesRecoverySyncMock.mockResolvedValue([]);
    foldersRecoverySyncMock.mockResolvedValue([]);
    sleepMock.mockResolvedValue(undefined);
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
    const result = await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toHaveLength(0);
    expect(result.error?.name).toBe('AbortError');
    expect(result.error?.constructor).toBe(Error);
  });

  it('should repeat if we have more files', async () => {
    // Given
    filesRecoverySyncMock.mockResolvedValueOnce(Array(1000)).mockResolvedValueOnce(Array(999));
    // When
    await recoverySync(props);
    // Then
    calls(filesRecoverySyncMock).toMatchObject([{ offset: 0 }, { offset: 1000 }]);
  });

  it('returns errors so manual recovery can report failure', async () => {
    // Given
    const error = new Error('Failed to recover files');
    filesRecoverySyncMock.mockRejectedValueOnce(error);
    // When
    const result = await recoverySync(props);
    // Then
    expect(result.error).toBe(error);
  });

  it('returns cancellation when aborted during the final page', async () => {
    // Given
    filesRecoverySyncMock.mockImplementationOnce(() => {
      props.ctx.abortController.abort();
      return Promise.resolve([]);
    });
    // When
    const result = await recoverySync(props);
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(result.data).toBeUndefined();
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('returns cancellation when aborted during the final sleep', async () => {
    // Given
    sleepMock.mockImplementationOnce(() => {
      props.ctx.abortController.abort();
      return Promise.resolve();
    });
    // When
    const result = await recoverySync(props);
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(result.data).toBeUndefined();
  });

  it('treats a page rejection after abort as cancellation', async () => {
    // Given
    filesRecoverySyncMock.mockImplementationOnce(() => {
      props.ctx.abortController.abort();
      return Promise.reject(new Error('Request stopped'));
    });
    // When
    const result = await recoverySync(props);
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(props.ctx.logger.error).not.toHaveBeenCalled();
  });
});
