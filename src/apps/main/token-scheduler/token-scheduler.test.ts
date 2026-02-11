import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

import { TokenScheduler } from './TokenScheduler';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as obtainToken from '../auth/service';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

function createToken(expiresIn: StringValue) {
  const email = 'test@internxt.com';

  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn });
}

describe('Token Scheduler', () => {
  const obtainTokenMock = partialSpyOn(obtainToken, 'obtainToken');

  const jwtWithoutExpiration =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InV1aWQiOiIzMjE2YzUzNi1kZDJjLTVhNjEtOGM3Ni0yMmU0ZDQ4ZjY4OWUiLCJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwibmFtZSI6InRlc3QiLCJsYXN0bmFtZSI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RAaW50ZXJueHQuY29tIiwic2hhcmVkV29ya3NwYWNlIjp0cnVlLCJuZXR3b3JrQ3JlZGVudGlhbHMiOnsidXNlciI6InRlc3RAaW50ZXJueHQuY29tIiwicGFzcyI6IiQyYSQwOCQ2QmhjZkRxaDE4c0kwN25kb2x0N29PNEtaTkpVQmpXSzYvZTRxMWppclR2SzdOTWE4dmZpLiJ9fSwiaWF0IjoxNjY3ODI4MDA2fQ.ckwjRsdNu9UUKUtdO3G32SwUUoMj7FAAOuBqVsIemo0';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not schedule if token does not have expiration time', () => {
    // Given
    obtainTokenMock.mockReturnValue(jwtWithoutExpiration);
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
    call(loggerMock.error).toMatchObject({ msg: 'Error scheduling refresh token' });
  });

  it('should schedule if token is valid', () => {
    // Given
    obtainTokenMock.mockReturnValue(createToken('31 day'));
    // When
    TokenScheduler.schedule();
    // Then
    expect(TokenScheduler.getTimeout()).not.toBe(undefined);
    call(loggerMock.debug).toMatchObject({
      msg: 'Token renew date',
      expiresAt: new Date('1970-02-01'),
      renewAt: new Date('1970-01-31'),
    });
  });
});
