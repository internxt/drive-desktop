import { logout } from './logout.service';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import * as saveConfigModule from './utils/save-config';
import * as resetConfigModule from './utils/reset-config';
import * as resetCredentialsModule from './utils/reset-credentials';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { DriveServerWipError } from '@/infra/drive-server-wip/out/error.types';

describe('logout service', () => {
  const logoutMock = vi.spyOn(driveServerWipModule.auth, 'logout');
  const saveConfigMock = vi.spyOn(saveConfigModule, 'saveConfig');
  const resetConfigMock = vi.spyOn(resetConfigModule, 'resetConfig');
  const resetCredentialsMock = vi.spyOn(resetCredentialsModule, 'resetCredentials');

  beforeEach(() => {
    vi.clearAllMocks();

    saveConfigMock.mockReturnValue();
    resetConfigMock.mockReturnValue();
    resetCredentialsMock.mockReturnValue();
  });

  it('should send a logout request to invalidate the user session', async () => {
    logoutMock.mockResolvedValue({ error: undefined, data: true });
    await logout();

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(saveConfigMock).toHaveBeenCalled();
    expect(resetConfigMock).toHaveBeenCalled();
    expect(resetCredentialsMock).toHaveBeenCalled();
  });

  it('should log an error if the logout request fails', async () => {
    const error = new DriveServerWipError('Logout failed', { code: 'LOGOUT_ERROR' });
    logoutMock.mockResolvedValue({ error });

    await logout();

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(loggerMock.error).toHaveBeenCalledWith({
      tag: 'AUTH',
      msg: 'Could not properly invalidate user session',
      error,
    });
    expect(saveConfigModule.saveConfig).toHaveBeenCalled();
    expect(resetConfigModule.resetConfig).toHaveBeenCalled();
    expect(resetCredentialsModule.resetCredentials).toHaveBeenCalled();
  });
});
