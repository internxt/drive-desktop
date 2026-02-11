import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

import { TokenScheduler } from './TokenScheduler';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as obtainToken from '../auth/service';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

function createToken(expiresIn: StringValue) {
  const email = 'test@internxt.com';

  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn });
}

describe('token-scheduler', () => {
  const obtainTokenMock = partialSpyOn(obtainToken, 'obtainToken');
  const updateCredentialsMock = partialSpyOn(obtainToken, 'updateCredentials');
  const refreshMock = partialSpyOn(driveServerWip.auth, 'refresh');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not schedule if token does not have expiration time', () => {
    // Given
    obtainTokenMock.mockReturnValue(createToken('0 day'));
    // When
    TokenScheduler.schedule();
    // Then
    expect(TokenScheduler.getTimeout()).toBe(undefined);
    call(loggerMock.error).toMatchObject({
      error: new Error('Token does not have expiration time'),
      msg: 'Error scheduling refresh token',
    });
  });

  it('should not schedule if token is invalid', () => {
    // Given
    obtainTokenMock.mockReturnValue('invalid');
    // When
    TokenScheduler.schedule();
    // Then
    expect(TokenScheduler.getTimeout()).toBe(undefined);
    call(loggerMock.error).toMatchObject({
      msg: 'Error scheduling refresh token',
      error: expect.objectContaining({
        message: expect.stringContaining('Invalid token specified'),
      }),
    });
  });

  it('should refresh if token is expired', async () => {
    // Given
    obtainTokenMock.mockReturnValueOnce(createToken('1 day')).mockReturnValueOnce(createToken('31 day'));
    refreshMock.mockResolvedValue({ data: { newToken: 'token' } });
    // When
    TokenScheduler.schedule();
    await vi.runOnlyPendingTimersAsync();
    // Then
    expect(TokenScheduler.getTimeout()).not.toBe(undefined);
    call(updateCredentialsMock).toStrictEqual({ newToken: 'token' });
    calls(loggerMock.debug).toMatchObject([
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-01-02'),
        renewAt: new Date('1970-01-01'),
      },
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-02-01'),
        renewAt: new Date('1970-01-31'),
      },
    ]);
  });
});
