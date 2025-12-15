import { deleteFiles } from './delete-files';
import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as deleteFileByUuidModule from '@/infra/drive-server-wip/out/ipc-main';

describe('delete-files', () => {
  const deleteFileByUuidMock = partialSpyOn(deleteFileByUuidModule, 'deleteFileByUuid');

  const deleted = [{ uuid: 'uuid1' as FileUuid }, { uuid: 'uuid2' as FileUuid }];

  it('If signal is aborted then do nothing', async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort();

    // When
    const props = mockProps<typeof deleteFiles>({ deleted, context: { abortController } });
    await deleteFiles(props);

    // Then
    expect(deleteFileByUuidMock).toHaveBeenCalledTimes(0);
  });

  it('If signal is aborted during execution then stop it', async () => {
    // Given
    const abortController = new AbortController();
    deleteFileByUuidMock.mockImplementationOnce(() => {
      abortController.abort();
      return Promise.resolve({ data: true });
    });

    // When
    const props = mockProps<typeof deleteFiles>({ deleted, context: { abortController } });
    await deleteFiles(props);

    // Then
    expect(deleteFileByUuidMock).toHaveBeenCalledTimes(1);
  });

  it('If signal is not aborted then delete files', async () => {
    // Given
    const abortController = new AbortController();

    // When
    const props = mockProps<typeof deleteFiles>({ deleted, context: { abortController } });
    await deleteFiles(props);

    // Then
    expect(deleteFileByUuidMock).toHaveBeenCalledTimes(2);
  });
});
