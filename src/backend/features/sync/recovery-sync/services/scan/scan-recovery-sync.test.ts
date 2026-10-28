import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { scanRecoverySync } from './scan-recovery-sync';
import * as scanFilesModule from './scan-recovery-sync-files';
import * as scanFoldersModule from './scan-recovery-sync-folders';

describe('scan-recovery-sync', () => {
  const scanFilesMock = partialSpyOn(scanFilesModule, 'scanRecoverySyncFiles');
  const scanFoldersMock = partialSpyOn(scanFoldersModule, 'scanRecoverySyncFolders');

  const props = mockProps<typeof scanRecoverySync>({ ctx: { workspaceId: 'workspaceId' } });

  beforeEach(() => {
    scanFilesMock.mockResolvedValue({ data: undefined });
    scanFoldersMock.mockResolvedValue({ data: undefined });
  });

  it('should scan files and folders of the context', async () => {
    // When
    const { error } = await scanRecoverySync(props);
    // Then
    expect(error).toBeUndefined();
    calls(scanFilesMock).toStrictEqual([{ ctx: props.ctx }]);
    calls(scanFoldersMock).toStrictEqual([{ ctx: props.ctx }]);
  });

  it('should return the error of a failed scan', async () => {
    // Given
    const error = new Error('folders failed');
    scanFoldersMock.mockResolvedValue({ error });
    // When
    const result = await scanRecoverySync(props);
    // Then
    expect(result.error).toBe(error);
  });

  it('should wait for the other scan when one fails first', async () => {
    // Given
    let foldersFinished = false;
    scanFilesMock.mockResolvedValue({ error: new Error('files failed') });
    scanFoldersMock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      foldersFinished = true;
      return { data: undefined };
    });
    // When
    const { error } = await scanRecoverySync(props);
    // Then
    expect(error?.message).toBe('files failed');
    expect(foldersFinished).toBe(true);
  });

  it('should return an error and wait for the other scan when one throws', async () => {
    // Given
    let filesFinished = false;
    scanFoldersMock.mockRejectedValue(new Error('unexpected'));
    scanFilesMock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      filesFinished = true;
      return { data: undefined };
    });
    // When
    const { error } = await scanRecoverySync(props);
    // Then
    expect(error?.message).toBe('unexpected');
    expect(filesFinished).toBe(true);
  });
});
