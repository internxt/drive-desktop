import { deepMocked } from '../../../../../../tests/vitest/utils.helper.test';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('tryCreateDevice', () => {
  const createDeviceMock = deepMocked(driveServerWipModule.backup.createDevice);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return data when device is created successfully', () => {

  });
  it('should return an error when device name already exists', () => {});
  it('should return an error when device creation fails', () => {});
});
