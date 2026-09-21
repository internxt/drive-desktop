/* eslint-disable sonarjs/no-hardcoded-passwords */
import * as mailBridge from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import * as authService from '@/apps/main/auth/service';
import type { User } from '@/apps/main/types';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createMailBridgeSession } from './create-mail-bridge-session';
import * as credentialsService from './get-or-create-mail-bridge-credentials';

describe('create-mail-bridge-session', () => {
  const obtainTokenMock = partialSpyOn(authService, 'obtainToken');
  const getCredentialsMock = partialSpyOn(credentialsService, 'getOrCreateMailBridgeCredentials');
  const createMailClientMock = partialSpyOn(mailBridge, 'createMailClient');
  const prepareSessionMock = partialSpyOn(mailBridge, 'prepareMailBridgeSession');

  const user: User = {
    avatar: '',
    uuid: 'account-id',
    email: 'user@internxt.com',
    name: 'User',
    lastname: 'Internxt',
    bucket: '',
    bridgeUser: '',
    userId: 'user-id',
    rootFolderId: 'root-folder-id',
    privateKey: '',
    mnemonic: 'mnemonic',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    obtainTokenMock.mockReturnValue('token');
    getCredentialsMock.mockReturnValue({ data: { username: 'user@internxt.com', password: 'password' }, error: undefined });
    createMailClientMock.mockReturnValue({ getMailAccountKeys: () => Promise.resolve(undefined) });
  });

  it('returns an Error result when preparing the Bridge session rejects with an unknown value', async () => {
    prepareSessionMock.mockRejectedValueOnce('Mail API unavailable');

    await expect(createMailBridgeSession(user)).resolves.toEqual({ data: undefined, error: new Error('Mail API unavailable') });
  });
});
