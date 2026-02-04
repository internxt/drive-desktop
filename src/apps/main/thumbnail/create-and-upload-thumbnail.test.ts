import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createAndUploadThumbnail } from './create-and-upload-thumbnail';
import * as uploadThumbnail from './upload-thumnail';
import { nativeImage } from 'electron';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('create-and-upload-thumbnail', () => {
  const createThumbnailFromPathMock = deepMocked(nativeImage.createThumbnailFromPath);
  const uploadThumbnailMock = partialSpyOn(uploadThumbnail, 'uploadThumbnail');
  const createThumbnailMock = partialSpyOn(driveServerWip.files, 'createThumbnail');

  let props: Parameters<typeof createAndUploadThumbnail>[0];

  beforeEach(() => {
    uploadThumbnailMock.mockResolvedValue('contentsId');
    createThumbnailFromPathMock.mockResolvedValue({
      toPNG: () => Buffer.from('content'),
    });

    props = mockProps<typeof createAndUploadThumbnail>({});
  });

  it('should skip if path is not thumbnailable', async () => {
    // Given
    props.path = abs('/parent/file.txt');
    // When
    await createAndUploadThumbnail(props);
    // Then
    calls(createThumbnailFromPathMock).toHaveLength(0);
  });

  it('should upload thumbnail if path is thumbnailable', async () => {
    // Given
    props.path = abs('/parent/file.png');
    // When
    await createAndUploadThumbnail(props);
    // Then
    call(createThumbnailFromPathMock).toMatchObject([String.raw`\parent\file.png`, { width: 300, height: 300 }]);
    call(createThumbnailMock).toMatchObject({ context: { body: { bucketFile: 'contentsId', size: 7 } } });
  });

  it('should upload thumbnail if extension is upper case', async () => {
    // Given
    props.path = abs('/parent/file.PNG');
    // When
    await createAndUploadThumbnail(props);
    // Then
    call(createThumbnailFromPathMock).toMatchObject([String.raw`\parent\file.PNG`, { width: 300, height: 300 }]);
    call(createThumbnailMock).toMatchObject({ context: { body: { bucketFile: 'contentsId', size: 7 } } });
  });
});
