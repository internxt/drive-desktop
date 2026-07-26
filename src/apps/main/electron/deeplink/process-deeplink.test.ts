import { shell } from 'electron';
import { call } from '@/tests/vitest/utils.helper.test';
import { processDeeplink } from './process-deeplink';

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

  it('should reject a URL with a different hostname', () => {
    const url = 'https://evil.com/malicious';
    processDeeplink({ argv: [...argv, `internxt://notification/${url}`] });
    expect(openExternalMock).not.toHaveBeenCalled();
  });

  it('should reject a subdomain bypass attack', () => {
    const url = 'https://drive.internxt.com.evil.com';
    processDeeplink({ argv: [...argv, `internxt://notification/${url}`] });
    expect(openExternalMock).not.toHaveBeenCalled();
  });

  it('should reject a file protocol URL', () => {
    const url = 'file:///etc/passwd';
    processDeeplink({ argv: [...argv, `internxt://notification/${url}`] });
    expect(openExternalMock).not.toHaveBeenCalled();
  });
});
