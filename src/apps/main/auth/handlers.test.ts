import { TokenStatus } from '@internxt/lib';
import * as tokenValidation from '@/backend/features/auth/services/token/validate-token-and-check-expiration';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { checkIfUserIsLoggedIn } from './handlers';
import * as getUser from './service';

describe('handlers', () => {
  const getUserMock = partialSpyOn(getUser, 'getUser');
  const validateTokenAndCheckExpirationMock = partialSpyOn(tokenValidation, 'validateTokenAndCheckExpiration');

  describe('checkUserIsLoggedIn', () => {
    beforeEach(() => {
      getUserMock.mockReturnValue({ uuid: 'uuid' });
      validateTokenAndCheckExpirationMock.mockReturnValue({ data: TokenStatus.VALID });
    });

    it('should return undefined if user does not exist', () => {
      // Given
      getUserMock.mockReturnValue(null);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return undefined if token is expired', () => {
      // Given
      validateTokenAndCheckExpirationMock.mockReturnValue({ data: TokenStatus.EXPIRED });
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return undefined if cannot get token', () => {
      // Given
      validateTokenAndCheckExpirationMock.mockReturnValue({ error: new Error('Error getting token') });
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return user if token is not expired', () => {
      // Given
      validateTokenAndCheckExpirationMock.mockReturnValue({ data: TokenStatus.VALID });
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toStrictEqual({ uuid: 'uuid' });
    });

    it('should return user if token needs renewal but is not expired', () => {
      // Given
      validateTokenAndCheckExpirationMock.mockReturnValue({ data: TokenStatus.REFRESH_REQUIRED });
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toStrictEqual({ uuid: 'uuid' });
    });
  });
});
