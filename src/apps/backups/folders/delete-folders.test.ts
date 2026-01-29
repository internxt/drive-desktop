import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deleteFolders } from './delete-folders';
import * as scheduleRequest from '../schedule-request';
import * as deleteFileByUuid from '@/infra/drive-server-wip/out/ipc-main';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('delete-folders', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const deleteFileByUuidMock = partialSpyOn(deleteFileByUuid, 'deleteFileByUuid');

  let props: Parameters<typeof deleteFolders>[0];

  beforeEach(() => {
    scheduleRequestMock.mockImplementation(async ({ fn }) => {
      await fn();
    });

    props = mockProps<typeof deleteFolders>({
      deleted: [{ absolutePath: abs('/folder') }],
    });
  });

  it('should log if there is an error', async () => {
    // Given
    scheduleRequestMock.mockRejectedValue(new Error());
    // When
    await deleteFolders(props);
    // Then
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should delete file', async () => {
    // Given
    deleteFileByUuidMock.mockResolvedValue();
    // When
    await deleteFolders(props);
    // Then
    call(deleteFileByUuidMock).toMatchObject({ path: '/folder' });
  });
});
