import { Either, left, right } from '../../../../context/shared/domain/Either';
import { refreshToken } from './refresh-token';
import { RefreshTokenResponse } from '../../../../infra/drive-server/services/auth/auth.types';
import * as authServiceModule from '../service';
import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';
import * as handlers from '../handlers';

describe('refreshToken', () => {
  const authRefreshMock = partialSpyOn(driveServerModule.auth, 'refresh');
  const updateCredentialsMock = partialSpyOn(authServiceModule, 'updateCredentials');
  const onUserUnauthorizedMock = partialSpyOn(handlers, 'onUserUnauthorized');

  const refreshResult: Either<Error, RefreshTokenResponse> = right({
    token: 'abc',
    newToken: 'xyz',
    user: {
      email: 'user@example.com',
      userId: 'user-id',
      uuid: 'user-uuid',
    } as RefreshTokenResponse['user'],
  });

  it('should call onUserUnauthorized and return error when refresh fails', async () => {
    const mockError = new Error('Refresh request was not successful');
    authRefreshMock.mockResolvedValue(left(mockError));

    const result = await refreshToken();

    expect(result.isLeft()).toBe(true);
    expect(result.getLeft()).toBe(mockError);
    calls(onUserUnauthorizedMock).toHaveLength(1);
    calls(updateCredentialsMock).toHaveLength(0);
  });

  it('should return the token and the new token as an array if the refresh was successful', async () => {
    authRefreshMock.mockResolvedValue(refreshResult);

    const result = await refreshToken();

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toEqual(['abc', 'xyz']);
    call(updateCredentialsMock).toMatchObject(['abc', 'xyz']);
    calls(onUserUnauthorizedMock).toHaveLength(0);
  });

  it('should update credentials with the new tokens', async () => {
    authRefreshMock.mockResolvedValue(refreshResult);

    await refreshToken();

    calls(updateCredentialsMock).toHaveLength(1);
    call(updateCredentialsMock).toMatchObject(['abc', 'xyz']);
  });
});
