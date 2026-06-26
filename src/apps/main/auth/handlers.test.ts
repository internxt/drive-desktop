import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { checkIfUserIsLoggedIn } from './handlers';
import * as getUser from './service';

describe('handlers', () => {
  const getUserMock = partialSpyOn(getUser, 'getUser');
  const getMillisecondsToExpireMock = partialSpyOn(TokenScheduler, 'getMillisecondsToExpire');

  describe('checkUserIsLoggedIn', () => {
    beforeEach(() => {
      getUserMock.mockReturnValue({ uuid: 'uuid' });
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
      getMillisecondsToExpireMock.mockReturnValue(-1);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return undefined if cannot get token', () => {
      // Given
      getMillisecondsToExpireMock.mockReturnValue(null);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return user if token is not expired', () => {
      // Given
      getMillisecondsToExpireMock.mockReturnValue(100);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toStrictEqual({ uuid: 'uuid' });
    });

    it('should return user if token needs renewal but is not expired', () => {
      // Given
      getMillisecondsToExpireMock.mockReturnValue(3 * 60 * 60 * 1000);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toStrictEqual({ uuid: 'uuid' });
    });
  });
});
