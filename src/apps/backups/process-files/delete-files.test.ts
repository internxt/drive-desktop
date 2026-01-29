import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deleteFiles } from './delete-files';
import * as scheduleRequest from '../schedule-request';
import * as deleteFileByUuid from '@/infra/drive-server-wip/out/ipc-main';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('delete-files', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const deleteFileByUuidMock = partialSpyOn(deleteFileByUuid, 'deleteFileByUuid');

  let props: Parameters<typeof deleteFiles>[0];

  beforeEach(() => {
    scheduleRequestMock.mockImplementation(async ({ fn }) => {
      await fn();
    });

    props = mockProps<typeof deleteFiles>({
      deleted: [{ absolutePath: abs('/file.txt') }],
    });
  });

  it('should log if there is an error', async () => {
    // Given
    scheduleRequestMock.mockRejectedValue(new Error());
    // When
    await deleteFiles(props);
    // Then
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should delete file', async () => {
    // Given
    deleteFileByUuidMock.mockResolvedValue();
    // When
    await deleteFiles(props);
    // Then
    call(deleteFileByUuidMock).toMatchObject({ path: '/file.txt' });
  });
});
