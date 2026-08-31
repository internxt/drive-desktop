import { mockDeep } from 'vitest-mock-extended';
import { LocalSync } from '@/backend/features';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { environmentFileUpload } from './environment-file-uploader';
import * as uploadFile from './upload-file';

describe('environment-file-upload', () => {
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const abortController = mockDeep<AbortController>();

  let props: Parameters<typeof environmentFileUpload>[0];

  beforeEach(() => {
    props = mockProps<typeof environmentFileUpload>({
      ctx: { abortController },
    });
  });

  it('should start progress and add and remove abort listeners', async () => {
    // When
    await environmentFileUpload(props);
    // Then
    calls(uploadFileMock).toHaveLength(1);
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 0 });
    call(abortController.signal.addEventListener).toStrictEqual(['abort', expect.any(Function)]);
    call(abortController.signal.removeEventListener).toStrictEqual(['abort', expect.any(Function)]);
  });

  it('should remove abort listener even if the upload throws', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error('boom'));
    // When
    await expect(environmentFileUpload(props)).rejects.toThrow('boom');
    // Then
    call(abortController.signal.removeEventListener).toStrictEqual(['abort', expect.any(Function)]);
  });
});
