import { mockProps } from '@/tests/vitest/utils.helper.test';

import { isSafeWebBrowserFile } from './is-safe-web-browser-file';

describe('isSafeWebBrowserFile', () => {
  let props: Parameters<typeof isSafeWebBrowserFile>[0];
  beforeEach(() => {
    props = mockProps<typeof isSafeWebBrowserFile>({
      fileName: '',
      ctx: {
        browser: {
          criticalExtensions: ['.sqlite', '.db', '.log'],
          criticalFilenames: ['lock', 'prefs.js', 'local state'],
        },
      },
    });
  });

  describe('Cross-platform critical patterns', () => {
    it.each(['file.sqlite', 'data.db', 'config.log'])('should reject files with critical extensions: "%s"', (file) => {
      props.fileName = file;
      expect(isSafeWebBrowserFile(props)).toBe(false);
    });

    it.each(['lock', 'prefs.js', 'local state'])('should reject files with critical filenames: "%s"', (file) => {
      props.fileName = file;
      expect(isSafeWebBrowserFile(props)).toBe(false);
    });

    it.each(['document.txt', 'image.png', 'video.mp4'])('should allow safe file: "%s"', (file) => {
      props.fileName = file;
      expect(isSafeWebBrowserFile(props)).toBe(true);
    });
  });
});
