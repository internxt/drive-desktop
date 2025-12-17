import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { obtainTokens, refreshToken } from './refresh-token';
import { RefreshTokenResponse } from '../../../../infra/drive-server/services/auth/auth.types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { updateCredentials } from '../service';
import { Mock } from 'vitest';

vi.mock('../../../../infra/drive-server/drive-server.module', () => ({
  driveServerModule: {
    auth: {
      refresh: vi.fn(),
    },
  },
}));

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../service', () => {
  return {
    updateCredentials: vi.fn(),
    obtainTokens: vi.fn().mockReturnValue(['stored-token-1', 'stored-token-2']),
    getUser: vi.fn().mockReturnValue({
      /* mock user object */
    }),
    tokensArePresent: vi.fn().mockReturnValue(true),
    logout: vi.fn(),
  };
});

vi.mock('../../token-scheduler/TokenScheduler', () => {
  return {
    TokenScheduler: vi.fn().mockImplementation(() => ({
      schedule: vi.fn().mockReturnValue(true),
    })),
  };
});

describe('refresh-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      (driveServerModule.auth.refresh as Mock).mockResolvedValue(refreshResult);

      const result = await obtainTokens();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toStrictEqual(expect.objectContaining({ token: 'abc', newToken: 'xyz' }));
    });

    it('should return an error if the token is not obtained', async () => {
      const mockError = new Error('Refresh request was not successful');
      const leftResult: Either<Error, RefreshTokenResponse> = left(mockError);
      (driveServerModule.auth.refresh as Mock).mockResolvedValue(leftResult);

      const result = await obtainTokens();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toEqual(mockError);
    });

    it('should return an error if an error is thrown during the refresh process', async () => {
      const thrownError = new Error('Unexpected failure');
      (driveServerModule.auth.refresh as Mock).mockRejectedValue(thrownError);

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
      (driveServerModule.auth.refresh as Mock).mockResolvedValue(left(mockError));

      const result = await refreshToken();

      expect(result.isLeft()).toBe(true);
      expect(result.getLeft()).toBe(mockError);
    });

    it('should updateCredentials if the refresh was successful', async () => {
      const mockData = { token: 'abc', newToken: 'xyz' };
      (driveServerModule.auth.refresh as Mock).mockResolvedValue(right(mockData));

      await refreshToken();

      expect(updateCredentials).toHaveBeenCalledWith('abc', 'xyz');
    });

    it('should return the token and the new token as an array if the refresh was successfull', async () => {
      const mockData = { token: 'abc', newToken: 'xyz' };
      (driveServerModule.auth.refresh as Mock).mockResolvedValue(right(mockData));

      const result = await refreshToken();

      expect(result.isRight()).toBe(true);
      expect(result.getRight()).toEqual(['abc', 'xyz']);
    });
  });

  describe('createTokenSchedule', () => {
    let refreshTokenMock: Mock;
    let TokenSchedulerMock: Mock;
    let scheduleMock: Mock;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();

      scheduleMock = vi.fn().mockReturnValue(true);
      TokenSchedulerMock = vi.fn().mockImplementation(() => ({
        schedule: scheduleMock,
      }));

      vi.doMock('../../token-scheduler/TokenScheduler', () => ({
        TokenScheduler: TokenSchedulerMock,
      }));

      refreshTokenMock = vi.fn().mockResolvedValue(right(['new-token', 'new-token-2']));
      vi.doMock('./refresh-token', async () => {
        const actualModule = await vi.importActual('./refresh-token');
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

      const obtainTokensMock = serviceModule.obtainTokens as Mock;
      obtainTokensMock.mockReturnValue(storedTokens);

      await createTokenSchedule();

      expect(obtainTokensMock).toHaveBeenCalled();
      expect(TokenSchedulerMock).toHaveBeenCalledWith(5, storedTokens, expect.any(Function));
      expect(scheduleMock).toHaveBeenCalled();
      expect(refreshTokenMock).not.toHaveBeenCalled();
    });

    it('should logs debug and calls refreshToken when schedule() is false', async () => {
      scheduleMock.mockReturnValue(false);

      // Mock driveServerModule.auth.refresh to simulate successful token refresh
      const mockRefreshResponse = {
        token: 'new-token',
        newToken: 'new-token-2',
        user: {
          email: 'test@example.com',
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
      };

      (driveServerModule.auth.refresh as Mock).mockResolvedValue(right(mockRefreshResponse));

      const { createTokenSchedule } = await import('./refresh-token');

      await createTokenSchedule();

      expect(logger.debug).toHaveBeenCalledWith({
        msg: '[TOKEN] Failed to create token schedule',
        tag: 'AUTH',
      });
      // scheduleMock called twice: initially (returns false), then in recursive createTokenSchedule
      expect(scheduleMock).toHaveBeenCalledTimes(2);
      // Verify that driveServerModule.auth.refresh was called (which means refreshToken was called)
      expect(driveServerModule.auth.refresh).toHaveBeenCalled();
      // Verify updateCredentials was called with the new tokens
      expect(updateCredentials).toHaveBeenCalledWith('new-token', 'new-token-2');
    });
  });
});
