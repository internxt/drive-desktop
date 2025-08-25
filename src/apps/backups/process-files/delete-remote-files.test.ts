import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deleteRemoteFiles } from './delete-remote-files';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('delete-remote-files', () => {
  const deleteFileByUuidMock = vi.mocked(driveServerWip.storage.deleteFileByUuid);

  const deleted = [{ uuid: 'uuid1' as FileUuid }, { uuid: 'uuid2' as FileUuid }];

  it('If signal is aborted then do nothing', async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort();

    // When
    const props = mockProps<typeof deleteRemoteFiles>({ deleted, context: { abortController } });
    await deleteRemoteFiles(props);

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
    const props = mockProps<typeof deleteRemoteFiles>({ deleted, context: { abortController } });
    await deleteRemoteFiles(props);

    // Then
    expect(deleteFileByUuidMock).toHaveBeenCalledTimes(1);
  });

  it('If signal is not aborted then delete files', async () => {
    // Given
    const abortController = new AbortController();

    // When
    const props = mockProps<typeof deleteRemoteFiles>({ deleted, context: { abortController } });
    await deleteRemoteFiles(props);

    // Then
    expect(deleteFileByUuidMock).toHaveBeenCalledTimes(2);
  });
});
