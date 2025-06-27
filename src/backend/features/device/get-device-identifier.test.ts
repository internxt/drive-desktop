import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { getMachineGuid } from '@/infra/device/get-machine-guid';
import { getDeviceIdentifier } from '@/backend/features/device/get-device-identifier';
import os from 'os';

vi.mock('@/infra/device/get-machine-guid');
vi.mock('os');

describe('getDeviceIdentifier', () => {
  const getMachineGuidMock = deepMocked(getMachineGuid);
  const getHostnameMock = deepMocked(os.hostname);
  const getPlatformMock = deepMocked(os.platform);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return the device key with platform and hostname', () => {
    getMachineGuidMock.mockReturnValue({ data: 'mocked-machine-guid' });
    getHostnameMock.mockReturnValue('mocked-hostname');
    getPlatformMock.mockReturnValue('win32');

    const { key, platform, hostname } = getDeviceIdentifier();

    expect(getMachineGuidMock).toHaveBeenCalledTimes(1);
    expect(key).toBe('mocked-machine-guid');
    expect(platform).toBe('win32');
    expect(hostname).toBe('mocked-hostname');
    expect(getHostnameMock).toHaveBeenCalledTimes(1);
    expect(getPlatformMock).toHaveBeenCalledTimes(1);
  });

  it('should return hostname and platform if key is not available', () => {
    getMachineGuidMock.mockReturnValue({ data: undefined });
    getHostnameMock.mockReturnValue('mocked-hostname');
    getPlatformMock.mockReturnValue('linux');

    const { key, platform, hostname } = getDeviceIdentifier();

    expect(key).toBeUndefined();
    expect(platform).toBe('linux');
    expect(hostname).toBe('mocked-hostname');
    expect(getMachineGuidMock).toHaveBeenCalledTimes(1);
    expect(getHostnameMock).toHaveBeenCalledTimes(1);
    expect(getPlatformMock).toHaveBeenCalledTimes(1);
  });

  it('should return all undefined if platform and hostname are not available', () => {
    getMachineGuidMock.mockReturnValue({ data: undefined });
    getHostnameMock.mockReturnValue('');
    getPlatformMock.mockReturnValue('');

    const { key, platform, hostname } = getDeviceIdentifier();

    expect(key).toBeUndefined();
    expect(platform).toBeUndefined();
    expect(hostname).toBeUndefined();
    expect(getMachineGuidMock).toHaveBeenCalledTimes(1);
    expect(getHostnameMock).toHaveBeenCalledTimes(1);
    expect(getPlatformMock).toHaveBeenCalledTimes(1);
  });
});
