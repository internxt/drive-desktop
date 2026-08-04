import { logger } from '@internxt/drive-desktop-core/build/backend';
import { auth } from '@internxt/lib';
import * as authService from '@/apps/main/auth/service';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { validateToken } from './validate-token';

describe('validateToken', () => {
  const obtainTokenMock = partialSpyOn(authService, 'obtainToken');
  const validateJwtMock = vi.spyOn(auth, 'validateJwt');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the decoded claims for a valid stored token', () => {
    const token = 'valid-token';
    const claims = { exp: 1_800_000_000, iat: 1_700_000_000 };
    obtainTokenMock.mockReturnValue(token);
    validateJwtMock.mockReturnValue(claims);

    expect(validateToken()).toEqual({ data: claims });
    expect(validateJwtMock).toHaveBeenCalledWith(token);
  });

  it('returns an error when the stored token is invalid', () => {
    obtainTokenMock.mockReturnValue('invalid-token');
    validateJwtMock.mockReturnValue(null);

    const result = validateToken();

    expect(result.error).toEqual(new Error('Token could not be validated'));
    expect(logger.error).toHaveBeenCalledWith({
      tag: 'AUTH',
      msg: 'Token could not be validated',
      error: result.error,
    });
  });

  it('returns the token-read error', () => {
    const error = new Error('Unable to decrypt token');
    obtainTokenMock.mockImplementation(() => {
      throw error;
    });

    expect(validateToken()).toEqual({ error });
    expect(logger.error).toHaveBeenCalledWith({ tag: 'AUTH', msg: 'Error while validating token', error });
  });
});
