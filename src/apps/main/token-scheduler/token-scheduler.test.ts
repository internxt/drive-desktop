import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as obtainToken from '../auth/service';
import { TokenScheduler } from './TokenScheduler';

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

  it('should return Infinity if token does not have expiration time', () => {
    // Given
    obtainTokenMock.mockReturnValue(createToken('0 day'));
    // When
    TokenScheduler.getMillisecondsToRenew();
    // Then
    expect(TokenScheduler.timeout).toBeUndefined();
    call(loggerMock.error).toMatchObject({
      error: new Error('Token does not have expiration time'),
      msg: 'Error getting token',
    });
  });

  it('should return Infinity if token is invalid', () => {
    // Given
    obtainTokenMock.mockReturnValue('invalid');
    // When
    TokenScheduler.getMillisecondsToRenew();
    // Then
    expect(TokenScheduler.timeout).toBeUndefined();
    call(loggerMock.error).toMatchObject({
      msg: 'Error getting token',
      error: expect.objectContaining({
        message: expect.stringContaining('Invalid token specified'),
      }),
    });
  });

  it('should renew tokens every 4 hours', async () => {
    // Given
    obtainTokenMock.mockImplementationOnce(() => createToken('12 hours')).mockImplementationOnce(() => createToken('12 hours'));
    refreshMock.mockResolvedValue({ data: { newToken: 'token' } });
    // When
    TokenScheduler.schedule();
    await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000 - 1);
    // Then
    expect(refreshMock).not.toHaveBeenCalled();
    // When
    await vi.runOnlyPendingTimersAsync();
    // Then
    expect(TokenScheduler.timeout).not.toBe(undefined);
    call(updateCredentialsMock).toStrictEqual({ newToken: 'token' });
    calls(loggerMock.debug).toMatchObject([
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-01-01T12:00:00.000Z'),
        renewAt: new Date('1970-01-01T04:00:00.000Z'),
      },
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-01-01T16:00:00.000Z'),
        renewAt: new Date('1970-01-01T08:00:00.000Z'),
      },
    ]);
  });

  it('should renew immediately if token expires in less than 4 hours', async () => {
    // Given
    obtainTokenMock.mockImplementationOnce(() => createToken('3 hours')).mockImplementationOnce(() => createToken('12 hours'));
    refreshMock.mockResolvedValue({ data: { newToken: 'token' } });
    // When
    TokenScheduler.schedule();
    await vi.runOnlyPendingTimersAsync();
    // Then
    call(updateCredentialsMock).toStrictEqual({ newToken: 'token' });
    calls(loggerMock.debug).toMatchObject([
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-01-01T03:00:00.000Z'),
        renewAt: new Date('1970-01-01T00:00:00.000Z'),
        msToRenew: 0,
      },
      {
        msg: 'Token renew date',
        expiresAt: new Date('1970-01-01T12:00:00.000Z'),
        renewAt: new Date('1970-01-01T04:00:00.000Z'),
      },
    ]);
  });

  it('should return a negative delay if token is expired', () => {
    // Given
    obtainTokenMock.mockReturnValue(createToken('-1 second'));
    // When
    const result = TokenScheduler.getMillisecondsToRenew();
    // Then
    expect(result).toBeLessThan(0);
  });
});
