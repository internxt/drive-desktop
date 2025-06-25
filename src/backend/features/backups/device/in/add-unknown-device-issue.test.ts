import { beforeEach } from 'vitest';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { addUnknownDeviceIssue } from '@/backend/features/backups/device/in/add-unknown-device-issue';

vi.mock(import('@/apps/main/background-processes/issues'));

describe('addUnknownDeviceIssue', () => {
  const addGeneralIssueMock = deepMocked(addGeneralIssue);

  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should add an issue with the error name and a fixed error code', () => {
    const error = new Error('Test error');
    error.name = 'Test error';

    addUnknownDeviceIssue(error);

    expect(addGeneralIssueMock).toHaveBeenCalledWith({
      name: error.name,
      error: 'UNKNOWN_DEVICE_NAME',
    });
  });
});
