import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deleteRemoteFiles } from './delete-remote-files';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { FileMother } from 'tests/context/virtual-drive/files/domain/FileMother';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('delete-remote-files', () => {
  const deleteFileByUuidMock = vi.mocked(driveServerWip.storage.deleteFileByUuid);

  const file1 = FileMother.any();
  const file2 = FileMother.any();
  const deleted = [file1, file2];

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
