import { mockDeep } from 'vitest-mock-extended';
import { EnvironmentFileUploader } from './environment-file-uploader';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from './upload-file';
import { createReadStream, ReadStream } from 'node:fs';
import { LocalSync } from '@/backend/features';

vi.mock(import('node:fs'));

describe('environment-file-uploader', () => {
  const createReadStreamMock = vi.mocked(createReadStream);
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const readable = mockDeep<ReadStream>();

  let props: Parameters<typeof EnvironmentFileUploader.run>[0];

  beforeEach(() => {
    createReadStreamMock.mockReturnValue(readable);

    props = mockProps<typeof EnvironmentFileUploader.run>({
      ctx: {
        environment: {
          upload: vi.fn(),
          uploadMultipartFile: vi.fn(),
        },
      },
    });
  });

  it('should use upload if file is small than 100MB', async () => {
    // Given
    props.size = 100 * 1024 * 1024 - 1;
    // When
    await EnvironmentFileUploader.run(props);
    // Then
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 0 });
    call(uploadFileMock).toMatchObject({ fn: props.ctx.environment.upload });
  });

  it('should use multipart upload if file is bigger than 100MB', async () => {
    // Given
    props.size = 100 * 1024 * 1024 + 1;
    // When
    await EnvironmentFileUploader.run(props);
    // Then
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 0 });
    call(uploadFileMock).not.toMatchObject({ fn: props.ctx.environment.upload });
  });
});
