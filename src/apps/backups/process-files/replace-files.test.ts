import { Sync } from '@/backend/features/sync';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as scheduleRequest from '../schedule-request';
import { replaceFiles } from './replace-files';

describe('replace-files', () => {
  const scheduleRequestMock = partialSpyOn(scheduleRequest, 'scheduleRequest');
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');

  let props: Parameters<typeof replaceFiles>[0];

  beforeEach(() => {
    scheduleRequestMock.mockImplementation(async ({ fn }) => {
      await fn();
    });

    props = mockProps<typeof replaceFiles>({
      modified: [{ local: { path: abs('/file.txt') }, remote: {} }],
    });
  });

  it('should log if there is an error', async () => {
    // Given
    scheduleRequestMock.mockRejectedValue(new Error());
    // When
    await replaceFiles(props);
    // Then
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should replace file', async () => {
    // Given
    replaceFileMock.mockResolvedValue({});
    // When
    await replaceFiles(props);
    // Then
    call(replaceFileMock).toMatchObject({ path: '/file.txt' });
  });
});
