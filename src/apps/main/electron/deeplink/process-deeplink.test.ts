import { processDeeplink } from './process-deeplink';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as processLogin from './process-login';
import { shell } from 'electron';

describe('process-deeplink', () => {
  const openExternalMock = vi.mocked(shell.openExternal);
  const processLoginMock = partialSpyOn(processLogin, 'processLogin');

  const argv = [String.raw`C:\Users\user\AppData\Local\Programs\internxt-drive\Internxt.exe`, '--allow-file-access-from-files'];

  it('should process login if hostname is login-success', () => {
    // When
    processDeeplink({ argv: [...argv, 'internxt://login-success/?mnemonic=mnemonic&newToken=newToken&privateKey=privateKey'] });
    // Then
    call(processLoginMock).toStrictEqual({ search: '?mnemonic=mnemonic&newToken=newToken&privateKey=privateKey' });
  });

  it('should process notification if hostname is notification', () => {
    // Given
    const url = 'https://internxt.com/deals/black-friday-internxt?next=another-url&prop=value';
    // When
    processDeeplink({ argv: [...argv, `internxt://notification/${url}`] });
    // Then
    call(openExternalMock).toStrictEqual(url);
  });
});
