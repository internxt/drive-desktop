import { mockDeep } from 'vitest-mock-extended';
import { ContentsUploader } from './ContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { EnvironmentFileUploaderError } from '@/infra/inxt-js/file-uploader/process-error';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('fs'));

describe('contents-uploader', () => {
  const sendMock = partialSpyOn(ipcRendererSyncEngine, 'send');
  const remoteContentsManagersFactory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
  const uploader = mockDeep<EnvironmentFileUploader>();
  const service = new ContentsUploader(remoteContentsManagersFactory);

  const props = mockProps<typeof service.run>({
    path: createRelativePath('file.txt'),
    absolutePath: 'C:/Users/user/InternxtDrive/file.txt' as AbsolutePath,
    stats: { size: 1024 },
  });

  beforeEach(() => {
    remoteContentsManagersFactory.uploader.mockReturnValue(uploader);
  });

  it('should throw error if upload fails', async () => {
    // Given
    uploader.run.mockResolvedValue({ error: new EnvironmentFileUploaderError('ABORTED') });
    // When
    const promise = service.run(props);
    // Then
    await expect(promise).rejects.toThrow();
    expect(sendMock).toBeCalledWith('ADD_SYNC_ISSUE', { error: 'ABORTED', name: '/file.txt' });
  });

  it('should return contents id if upload is successful', async () => {
    // Given
    uploader.run.mockResolvedValue({ data: 'contentsId' as ContentsId });
    // When
    const result = await service.run(props);
    // Then
    expect(result).toStrictEqual({ id: 'contentsId', size: 1024 });
  });
});
