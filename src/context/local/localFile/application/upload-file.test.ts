import { uploadFile } from './upload-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '../infrastructure/AbsolutePath';
import { mockDeep } from 'vitest-mock-extended';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { EnvironmentFileUploaderError } from '@/infra/inxt-js/file-uploader/process-error';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('node:fs'));

describe('upload-file', () => {
  const uploader = mockDeep<EnvironmentFileUploader>();
  const props = mockProps<typeof uploadFile>({
    context: { fileUploader: uploader, abortController: new AbortController(), addIssue: vi.fn() },
    localFile: {
      absolutePath: 'C:\\Users\\user\\backup' as AbsolutePath,
      size: 1024,
    },
  });

  it('should return contentsId if upload is successful', async () => {
    // Given
    uploader.run.mockResolvedValueOnce({ data: 'contentsId' as ContentsId });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBe('contentsId');
  });

  it('should not log if ABORTED', async () => {
    // Given
    uploader.run.mockResolvedValueOnce({ error: new EnvironmentFileUploaderError('ABORTED') });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should not add issue if UNKNOWN', async () => {
    // Given
    uploader.run.mockResolvedValueOnce({ error: new EnvironmentFileUploaderError('UNKNOWN') });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    expect(loggerMock.error).toBeCalledTimes(1);
    expect(props.context.addIssue).toBeCalledTimes(0);
  });

  it('should add issue if not unknown', async () => {
    // Given
    uploader.run.mockResolvedValueOnce({ error: new EnvironmentFileUploaderError('NOT_ENOUGH_SPACE') });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    expect(loggerMock.error).toBeCalledTimes(1);
    expect(props.context.addIssue).toBeCalledTimes(1);
  });
});
