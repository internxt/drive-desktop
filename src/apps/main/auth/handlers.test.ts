import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { checkIfUserIsLoggedIn } from './handlers';
import * as getUser from './service';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';

describe('handlers', () => {
  const getUserMock = partialSpyOn(getUser, 'getUser');
  const getMillisecondsToRenewMock = partialSpyOn(TokenScheduler, 'getMillisecondsToRenew');

  beforeEach(() => {
    getUserMock.mockReturnValue({ uuid: 'uuid' });
  });

  describe('checkUserIsLoggedIn', () => {
    it('should return false if user does not exist', () => {
      // Given
      getUserMock.mockReturnValue(null);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return false if token is expired', () => {
      // Given
      getMillisecondsToRenewMock.mockReturnValue(-1);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return false if cannot get token', () => {
      // Given
      getMillisecondsToRenewMock.mockReturnValue(null);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toBeUndefined();
    });

    it('should return true if token is not expired', () => {
      // Given
      getMillisecondsToRenewMock.mockReturnValue(100);
      // When
      const res = checkIfUserIsLoggedIn();
      // Then
      expect(res).toStrictEqual({ uuid: 'uuid' });
    });
  });
});
