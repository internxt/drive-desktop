import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createPendingItems } from './create-pending-items';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as statReaddir from '@/infra/file-system/services/stat-readdir';
import * as createPendingFiles from './create-pending-files';
import * as createPendingFolders from './create-pending-folders';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('create-pending-items', () => {
  const statReaddirMock = partialSpyOn(statReaddir, 'statReaddir');
  const createPendingFilesMock = partialSpyOn(createPendingFiles, 'createPendingFiles');
  const createPendingFoldersMock = partialSpyOn(createPendingFolders, 'createPendingFolders');

  const files = [{ path: abs('/file.txt') }];
  const folders = [{ path: abs('/folders') }];
  const props = mockProps<typeof createPendingItems>({});

  it('should create pending files and folders', async () => {
    // Given
    statReaddirMock.mockResolvedValue({ files, folders });
    // When
    await createPendingItems(props);
    // Then
    call(createPendingFilesMock).toMatchObject({ files });
    call(createPendingFoldersMock).toMatchObject({ folders });
  });

  it('should handle errors', async () => {
    // Given
    statReaddirMock.mockRejectedValue(new Error());
    // When
    await createPendingItems(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating pending items' });
  });
});
