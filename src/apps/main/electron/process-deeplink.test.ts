import { shell } from 'electron';
import { processDeeplink } from './process-deeplink';
import { call } from '@/tests/vitest/utils.helper.test';

describe('process-deeplink', () => {
  const openExternalMock = vi.mocked(shell.openExternal);

  it('should navigate to link when marketing notification', () => {
    // Given
    const url = 'https://internxt.com/deals/black-friday-internxt?next=another-url&prop=value';
    // When
    processDeeplink({
      argv: [
        String.raw`C:\Users\user\AppData\Local\Programs\internxt-drive\Internxt.exe`,
        '--allow-file-access-from-files',
        `com.internxt.drive:action=navigate&contentId=${url}`,
      ],
    });
    // Then
    call(openExternalMock).toStrictEqual(url);
  });
});
