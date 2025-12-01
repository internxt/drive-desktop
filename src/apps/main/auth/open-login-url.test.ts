import { shell } from 'electron';
import { openLoginUrl, server } from './open-login-url';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as processLogin from '../electron/deeplink/process-login';

describe('open-login-url', () => {
  const processLoginMock = partialSpyOn(processLogin, 'processLogin');
  const openExternalMock = vi.mocked(shell.openExternal);

  it('should open login url and process the login callback', async () => {
    // Given
    processLoginMock.mockResolvedValue();
    // When
    openLoginUrl();
    // Then
    await vi.waitFor(async () => {
      call(openExternalMock).toStrictEqual(expect.stringContaining('https://drive.internxt.com/login?universalLink=true&redirectUri='));

      // Given
      const redirectUriBase64 = openExternalMock.mock.calls[0][0].split('redirectUri=')[1];
      const redirectUri = Buffer.from(redirectUriBase64, 'base64').toString('utf-8');
      // When
      const res = await fetch(`${redirectUri}?privateKey=privateKey&mnemonic=mnemonic&newToken=newToken`);
      // Then
      expect(res.url).toStrictEqual('https://drive.internxt.com/auth-link-ok');
    });

    call(processLoginMock).toStrictEqual({ search: '?privateKey=privateKey&mnemonic=mnemonic&newToken=newToken' });
    expect(server).toBeUndefined();
  });
});
