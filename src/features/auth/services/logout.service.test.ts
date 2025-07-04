import { logout } from './logout.service';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import * as saveConfigModule from './utils/save-config';
import * as resetConfigModule from './utils/reset-config';
import * as resetCredentialsModule from './utils/reset-credentials';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('logout service', () => {
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    driveServerWipModule.auth.logout = logoutMock;

    vi.spyOn(saveConfigModule, 'saveConfig').mockImplementation(() => {});
    vi.spyOn(resetConfigModule, 'resetConfig').mockImplementation(() => {});
    vi.spyOn(resetCredentialsModule, 'resetCredentials').mockImplementation(() => {});

    logoutMock.mockResolvedValue({ error: undefined });
  });

  it('should send a logout request to invalidate the user session', async () => {
    await logout();

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(saveConfigModule.saveConfig).toHaveBeenCalled();
    expect(resetConfigModule.resetConfig).toHaveBeenCalled();
    expect(resetCredentialsModule.resetCredentials).toHaveBeenCalled();
  });

  it('should log an error if the logout request fails', async () => {
    const error = new Error('Logout failed');
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
