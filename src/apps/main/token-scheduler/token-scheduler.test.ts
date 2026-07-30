import { auth } from '@internxt/lib';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as tokenValidation from '../../../backend/features/auth/services/token/validate-token';
import * as credentials from '../auth/service';
import { TokenScheduler } from './TokenScheduler';

describe('token-scheduler', () => {
  const validateTokenMock = partialSpyOn(tokenValidation, 'validateToken');
  const updateCredentialsMock = partialSpyOn(credentials, 'updateCredentials');
  const refreshMock = partialSpyOn(driveServerWip.auth, 'refresh');
  const calculateMillisecondsUntilRefreshMock = vi.spyOn(auth, 'calculateMillisecondsUntilRefresh');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    validateTokenMock.mockReturnValue({ data: { exp: 43_200, iat: 0 } });
    calculateMillisecondsUntilRefreshMock.mockReturnValue(21_600_000);
    refreshMock.mockResolvedValue({ data: { newToken: 'refreshed-token' } });
  });

  afterEach(() => {
    TokenScheduler.stop();
    vi.useRealTimers();
  });

  it('schedules a refresh using the library refresh threshold', async () => {
    TokenScheduler.schedule();

    expect(calculateMillisecondsUntilRefreshMock).toHaveBeenCalledWith(43_200, 0);
    await vi.advanceTimersByTimeAsync(21_600_000 - 1);
    expect(refreshMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(updateCredentialsMock).toHaveBeenCalledWith({ newToken: 'refreshed-token' });
    expect(TokenScheduler.timeout).toBeDefined();
  });

  it('does not schedule a refresh when the token cannot be validated', () => {
    const error = new Error('token could not be validated');
    validateTokenMock.mockReturnValue({ error });

    TokenScheduler.schedule();

    expect(refreshMock).not.toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalledWith({ tag: 'AUTH', msg: 'Error while scheduling token', error });
  });
});
