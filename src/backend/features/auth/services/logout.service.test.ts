import { logout } from './logout.service';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import * as saveConfigModule from './utils/save-config';
import * as resetConfigModule from './utils/reset-config';
import * as resetCredentialsModule from './utils/reset-credentials';
import * as areCredentialsAlreadyResetedModule from './utils/are-credentials-already-reseted';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { DriveServerWipError } from '@/infra/drive-server-wip/out/error.types';

describe('logout service', () => {
  const logoutMock = vi.spyOn(driveServerWipModule.auth, 'logout');
  const saveConfigMock = vi.spyOn(saveConfigModule, 'saveConfig');
  const resetConfigMock = vi.spyOn(resetConfigModule, 'resetConfig');
  const resetCredentialsMock = vi.spyOn(resetCredentialsModule, 'resetCredentials');
  const areCredentialsAlreadyResetedMock = vi.spyOn(areCredentialsAlreadyResetedModule, 'areCredentialsAlreadyReseted');

  beforeEach(() => {
    vi.clearAllMocks();

    saveConfigMock.mockReturnValue();
    resetConfigMock.mockReturnValue();
    resetCredentialsMock.mockReturnValue();
    areCredentialsAlreadyResetedMock.mockReturnValue(false);
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

  it('should log an error if the logout request fails with non-unauthorized error', async () => {
    const error = new DriveServerWipError('Logout failed', { code: 'LOGOUT_ERROR' });
    logoutMock.mockResolvedValue({ error });

    await logout();

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(loggerMock.error).toHaveBeenCalledWith({
      tag: 'AUTH',
      msg: 'Could not properly invalidate user session',
    });
    expect(saveConfigModule.saveConfig).toHaveBeenCalled();
    expect(resetConfigModule.resetConfig).toHaveBeenCalled();
    expect(resetCredentialsModule.resetCredentials).toHaveBeenCalled();
  });

  it('should not log an error if the logout request fails with unauthorized error', async () => {
    const error = new DriveServerWipError('UNAUTHORIZED', { cause: 'Unauthorized' });
    logoutMock.mockResolvedValue({ error });

    await logout();

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(saveConfigModule.saveConfig).toHaveBeenCalled();
    expect(resetConfigModule.resetConfig).toHaveBeenCalled();
    expect(resetCredentialsModule.resetCredentials).toHaveBeenCalled();
  });

  it('should not execute any logout logic if credentials are already reset', async () => {
    areCredentialsAlreadyResetedMock.mockReturnValue(true);

    await logout();

    expect(areCredentialsAlreadyResetedMock).toHaveBeenCalledOnce();
    expect(logoutMock).not.toHaveBeenCalled();
    expect(saveConfigModule.saveConfig).not.toHaveBeenCalled();
    expect(resetConfigModule.resetConfig).not.toHaveBeenCalled();
    expect(resetCredentialsModule.resetCredentials).not.toHaveBeenCalled();
    expect(loggerMock.info).not.toHaveBeenCalled();
  });
});
