import { mockDeep } from 'vitest-mock-extended';
import { environmentFileUpload } from './environment-file-uploader';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from './upload-file';
import { createReadStream, ReadStream } from 'node:fs';
import { LocalSync } from '@/backend/features';

vi.mock(import('node:fs'));

describe('environment-file-upload', () => {
  const createReadStreamMock = vi.mocked(createReadStream);
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const readable = mockDeep<ReadStream>();
  const abortController = mockDeep<AbortController>();

  let props: Parameters<typeof environmentFileUpload>[0];

  beforeEach(() => {
    createReadStreamMock.mockReturnValue(readable);

    props = mockProps<typeof environmentFileUpload>({
      ctx: { abortController },
    });
  });

  it('should start progress and add and remove abort listeners', async () => {
    // When
    await environmentFileUpload(props);
    // Then
    calls(readable.close).toHaveLength(1);
    calls(uploadFileMock).toHaveLength(1);
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 0 });
    call(abortController.signal.addEventListener).toStrictEqual(['abort', expect.any(Function)]);
    call(abortController.signal.removeEventListener).toStrictEqual(['abort', expect.any(Function)]);
  });
});
