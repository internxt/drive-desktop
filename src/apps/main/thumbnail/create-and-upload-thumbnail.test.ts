import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createAndUploadThumbnail } from './create-and-upload-thumbnail';
import * as uploadThumbnail from './upload-thumnail';
import { nativeImage } from 'electron';

describe('create-and-upload-thumbnail', () => {
  const createFromPathMock = deepMocked(nativeImage.createFromPath);
  const uploadThumbnailMock = partialSpyOn(uploadThumbnail, 'uploadThumbnail');
  const createThumbnailMock = partialSpyOn(driveServerWip.files, 'createThumbnail');

  const props = mockProps<typeof createAndUploadThumbnail>({});

  it('should skip if image is empty', async () => {
    // Given
    createFromPathMock.mockReturnValue({ isEmpty: () => true });
    // When
    await createAndUploadThumbnail(props);
    // Then
    calls(uploadThumbnailMock).toHaveLength(0);
  });

  it('should upload and create thumbnail when image is not empty', async () => {
    // Given
    uploadThumbnailMock.mockResolvedValue('contentsId');
    createFromPathMock.mockReturnValue({
      isEmpty: () => false,
      resize: () => {
        return {
          toPNG: () => Buffer.from('content'),
        } as any;
      },
    });
    // When
    await createAndUploadThumbnail(props);
    // Then
    call(createThumbnailMock).toMatchObject({ context: { body: { bucketFile: 'contentsId', size: 7 } } });
  });
});
