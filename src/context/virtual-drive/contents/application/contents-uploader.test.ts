import { mockDeep } from 'vitest-mock-extended';
import { ContentsUploader } from './ContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { EnvironmentFileUploaderError } from '@/infra/inxt-js/file-uploader/process-error';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

vi.mock(import('fs'));

describe('contents-uploader', () => {
  const sendMock = partialSpyOn(ipcRendererSyncEngine, 'send');
  const remoteContentsManagersFactory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
  const relativePathToAbsoluteConverter = mockDeep<RelativePathToAbsoluteConverter>();
  const uploader = mockDeep<EnvironmentFileUploader>();
  const service = new ContentsUploader(remoteContentsManagersFactory, relativePathToAbsoluteConverter);

  const props = mockProps<typeof service.run>({
    path: '',
    stats: { size: 1024 },
  });

  beforeEach(() => {
    relativePathToAbsoluteConverter.run.mockReturnValue('abolutePath');
    remoteContentsManagersFactory.uploader.mockReturnValue(uploader);
  });

  it('should throw error if upload fails', async () => {
    // Given
    uploader.run.mockResolvedValue({ error: new EnvironmentFileUploaderError('ABORTED') });
    // When
    const promise = service.run(props);
    // Then
    await expect(promise).rejects.toThrow();
    expect(sendMock).toBeCalledWith('ADD_SYNC_ISSUE', { error: 'ABORTED', name: '' });
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
