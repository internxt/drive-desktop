import { processDeeplink } from './process-deeplink';
import { call } from '@/tests/vitest/utils.helper.test';
import { shell } from 'electron';

describe('process-deeplink', () => {
  const openExternalMock = vi.mocked(shell.openExternal);

  const argv = [String.raw`C:\Users\user\AppData\Local\Programs\internxt-drive\Internxt.exe`, '--allow-file-access-from-files'];

  it('should process notification if hostname is notification', () => {
    // Given
    const url = 'https://internxt.com/deals/black-friday-internxt?next=another-url&prop=value';
    // When
    processDeeplink({ argv: [...argv, `internxt://notification/${url}`] });
    // Then
    call(openExternalMock).toStrictEqual(url);
  });
});
