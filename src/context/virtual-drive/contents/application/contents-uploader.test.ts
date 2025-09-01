import { mockDeep } from 'vitest-mock-extended';
import { ContentsUploader } from './ContentsUploader';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { EnvironmentFileUploaderError } from '@/infra/inxt-js/file-uploader/process-error';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('fs'));

describe('contents-uploader', () => {
  const sendMock = partialSpyOn(ipcRendererSyncEngine, 'send');
  const uploader = mockDeep<EnvironmentFileUploader>();

  const props = mockProps<typeof ContentsUploader.run>({
    ctx: { fileUploader: uploader },
    path: createRelativePath('file.txt'),
    absolutePath: 'C:/Users/user/InternxtDrive/file.txt' as AbsolutePath,
    stats: { size: 1024 },
  });

  it('should throw error if upload fails', async () => {
    // Given
    uploader.run.mockResolvedValue({ error: new EnvironmentFileUploaderError('ABORTED') });
    // When
    const promise = ContentsUploader.run(props);
    // Then
    await expect(promise).rejects.toThrow();
    expect(sendMock).toBeCalledWith('ADD_SYNC_ISSUE', { error: 'ABORTED', name: '/file.txt' });
  });

  it('should return contents id if upload is successful', async () => {
    // Given
    uploader.run.mockResolvedValue({ data: 'contentsId' as ContentsId });
    // When
    const result = await ContentsUploader.run(props);
    // Then
    expect(result).toStrictEqual({ id: 'contentsId', size: 1024 });
  });
});
