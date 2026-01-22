import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { uploadFile } from './upload-file';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('upload-file', () => {
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const uploadMock = partialSpyOn(EnvironmentFileUploader, 'run');

  const path = abs('/file.txt');
  const size = 1024;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    props = mockProps<typeof uploadFile>({ path, size });

    isTemporaryFileMock.mockReturnValue(false);
    uploadMock.mockResolvedValue('contentsId' as ContentsId);
  });

  it('should return empty contents id if the file is empty', async () => {
    // Given
    props.size = 0;
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: undefined });
    calls(uploadMock).toHaveLength(0);
  });

  it('should return undefined if the file is larger than MAX_SIZE', async () => {
    // Given
    props.size = SyncModule.MAX_FILE_SIZE + 1;
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(uploadMock).toHaveLength(0);
  });

  it('should return undefined if upload fails', async () => {
    // Given
    uploadMock.mockResolvedValue(undefined);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(uploadMock).toMatchObject({ path, size });
  });

  it('should return contents id if upload success', async () => {
    // Given
    uploadMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: 'contentsId' });
    call(uploadMock).toMatchObject({ path, size });
  });
});
