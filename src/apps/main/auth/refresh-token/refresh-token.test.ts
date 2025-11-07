import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { obtainTokens, refreshToken } from './refresh-token';
import { RefreshTokenResponse } from '../../../../infra/drive-server/services/auth/auth.types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { updateCredentials } from '../service';

jest.mock('../../../../infra/drive-server/drive-server.module', () => ({
  driveServerModule: {
    auth: {
      refresh: jest.fn(),
    },
  },
}));

jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../service', () => {
  return {
    updateCredentials: jest.fn(),
    obtainTokens: jest.fn().mockReturnValue(['stored-token-1', 'stored-token-2']),
    getUser: jest.fn().mockReturnValue({
      /* mock user object */
    }),
    tokensArePresent: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
  };
});

jest.mock('../../token-scheduler/TokenScheduler', () => {
  return {
    TokenScheduler: jest.fn().mockImplementation(() => ({
      schedule: jest.fn().mockReturnValue(true),
    })),
  };
});

describe('refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtainTokens', () => {
    it('should properly return the user refresh token and the old token if the refresh was successful', async () => {
      const refreshResult: Either<Error, RefreshTokenResponse> = right({
        token: 'abc',
        newToken: 'xyz',
        user: {
          email: 'user@example.com',
          userId: 'user-id',
          mnemonic: 'user mnemonic',
          root_folder_id: 1,
          rootFolderId: 'root-folder-id',
          name: 'John',
          lastname: 'Doe',
          uuid: 'user-uuid',
          credit: 100,
          createdAt: new Date().toISOString(),
          registerCompleted: true,
          username: 'johndoe',
          bridgeUser: 'bridge-user-id',
          backupsBucket: 'backups-bucket-id',
          avatar: 'avatar-url',
          emailVerified: true,
          lastPasswordChangedAt: new Date().toISOString(),
        },
      });
      (driveServerModule.auth.refresh as jest.Mock).mockResolvedValue(refreshResult);

      const result = await obtainTokens();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual({ token: 'abc', newToken: 'xyz' });
    });

    it('should return an error if the token is not obtained', async () => {
      const mockError = new Error('Refresh request was not successful');
      const leftResult: Either<Error, RefreshTokenResponse> = left(mockError);
      (driveServerModule.auth.refresh as jest.Mock).mockResolvedValue(leftResult);

      const result = await obtainTokens();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(mockError);
    });

    it('should return an error if an error is thrown during the refresh process', async () => {
      const thrownError = new Error('Unexpected failure');
      (driveServerModule.auth.refresh as jest.Mock).mockRejectedValue(thrownError);

      const result = await obtainTokens();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(thrownError);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: '[TOKEN] Could not obtain tokens',
          tag: 'AUTH',
          error: thrownError,
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return an error if the refresh token is not obtained', async () => {
      const mockError = new Error('Refresh request was not successful');
      (driveServerModule.auth.refresh as jest.Mock).mockResolvedValue(left(mockError));

      const result = await refreshToken();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(mockError);
    });

    it('should updateCredentials if the refresh was successful', async () => {
      const mockData = { token: 'abc', newToken: 'xyz' };
      (driveServerModule.auth.refresh as jest.Mock).mockResolvedValue(right(mockData));

      await refreshToken();

      expect(updateCredentials).toHaveBeenCalledWith('abc', 'xyz');
    });

    it('should return the token and the new token as an array if the refresh was successfull', async () => {
      const mockData = { token: 'abc', newToken: 'xyz' };
      (driveServerModule.auth.refresh as jest.Mock).mockResolvedValue(right(mockData));

      const result = await refreshToken();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(['abc', 'xyz']);
    });
  });

  describe('createTokenSchedule', () => {
    let refreshTokenMock: jest.Mock;
    let TokenSchedulerMock: jest.Mock;
    let scheduleMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();

      scheduleMock = jest.fn().mockReturnValue(true);
      TokenSchedulerMock = jest.fn().mockImplementation(() => ({
        schedule: scheduleMock,
      }));

      jest.doMock('../../token-scheduler/TokenScheduler', () => ({
        TokenScheduler: TokenSchedulerMock,
      }));

      refreshTokenMock = jest.fn().mockResolvedValue(right(['new-token', 'new-token-2']));
      jest.doMock('./refresh-token', () => {
        const actualModule = jest.requireActual('./refresh-token');
        return {
          ...actualModule,
          refreshToken: refreshTokenMock,
        };
      });
    });

    it('should properly create a token schedule with given refreshedTokens parameter', async () => {
      const { createTokenSchedule } = await import('./refresh-token');
      const { onUserUnauthorized } = await import('../handlers');

      const refreshedTokens = ['new-token-1', 'new-token-2'];

      await createTokenSchedule(refreshedTokens);

      expect(TokenSchedulerMock).toHaveBeenCalledWith(5, refreshedTokens, onUserUnauthorized);

      expect(scheduleMock).toHaveBeenCalled();
      expect(refreshTokenMock).not.toHaveBeenCalled();
    });

    it('should properly create a token schedule with the result of obtainStoredTokens function', async () => {
      const { createTokenSchedule } = await import('./refresh-token');
      const serviceModule = await import('../service');
      const storedTokens = ['stored-token-1', 'stored-token-2'];

      const obtainTokensMock = serviceModule.obtainTokens as jest.Mock;
      obtainTokensMock.mockReturnValue(storedTokens);

      await createTokenSchedule();

      expect(obtainTokensMock).toHaveBeenCalled();
      expect(TokenSchedulerMock).toHaveBeenCalledWith(5, storedTokens, expect.any(Function));
      expect(scheduleMock).toHaveBeenCalled();
      expect(refreshTokenMock).not.toHaveBeenCalled();
    });

    it('logs debug y llama a refreshToken cuando schedule() es false', async () => {
      scheduleMock.mockReturnValue(false);

      const { createTokenSchedule } = await import('./refresh-token');

      await createTokenSchedule();

      expect(logger.debug).toHaveBeenCalledWith({
        msg: '[TOKEN] Failed to create token schedule',
        tag: 'AUTH',
      });
      expect(scheduleMock).toHaveBeenCalledTimes(1);
    });
  });
});
