import * as mailBridge from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import * as authService from '@/apps/main/auth/service';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getMailBridgeEmail } from './get-mail-bridge-email.service';

describe('get-mail-bridge-email.service', () => {
  const obtainTokenMock = partialSpyOn(authService, 'obtainToken');
  const createMailClientMock = partialSpyOn(mailBridge, 'createMailClient');
  const retrieveMailAccountKeysMock = partialSpyOn(mailBridge, 'retrieveMailAccountKeys');

  beforeEach(() => {
    vi.clearAllMocks();
    obtainTokenMock.mockReturnValue('access-token');
    createMailClientMock.mockReturnValue({ getMailAccountKeys: async () => await Promise.resolve(undefined) });
  });

  it('returns the Mail account address', async () => {
    retrieveMailAccountKeysMock.mockResolvedValue({
      data: { address: 'johndoe@inxt.me', publicKey: 'public-key', encryptionPrivateKey: 'private-key' },
      error: undefined,
    });

    const result = await getMailBridgeEmail();

    expect(result).toEqual({ data: 'johndoe@inxt.me', error: undefined });
  });

  it('preserves the missing Mail account result', async () => {
    retrieveMailAccountKeysMock.mockResolvedValue({
      data: undefined,
      error: new mailBridge.MailBridgeSessionPreparationError('mail-not-setup', 'Mail account has not been set up'),
    });

    const result = await getMailBridgeEmail();

    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) expect(result.error).toMatchObject({ code: 'mail-not-setup', message: 'Mail account has not been set up' });
  });

  it('returns a generic error when creating the Mail client fails', async () => {
    createMailClientMock.mockImplementation(() => {
      throw new Error('Mail service is unavailable');
    });

    const result = await getMailBridgeEmail();

    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) expect(result.error).toMatchObject({ code: 'mail-key-fetch-failed', message: 'Mail service is unavailable' });
  });
});
