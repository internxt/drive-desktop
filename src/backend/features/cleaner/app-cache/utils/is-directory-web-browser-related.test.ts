import { isDirectoryWebBrowserRelated } from './is-directory-web-browser-related';

describe('isDirectoryWebBrowserRelated', () => {
  it('should return true for exact browser directory names', () => {
    const browserNames = [
      'google-chrome',
      'chromium',
      'firefox',
      'opera'
    ];

    browserNames.forEach(name => {
      expect(isDirectoryWebBrowserRelated(name)).toBe(true);
    });
  });

  it('should return true for browser names with case variations', () => {
    const browserNames = [
      'Google-Chrome',
      'CHROMIUM',
      'Firefox',
      'OPERA'
    ];

    browserNames.forEach(name => {
      expect(isDirectoryWebBrowserRelated(name)).toBe(true);
    });
  });

  it('should return true for directories containing browser names', () => {
    const browserDirectories = [
      'my-google-chrome-app',
      'chromium-browser',
      'firefox-dev',
      'opera-stable'
    ];

    browserDirectories.forEach(name => {
      expect(isDirectoryWebBrowserRelated(name)).toBe(true);
    });
  });

  it('should return false for non-browser directory names', () => {
    const nonBrowserNames = [
      'vscode',
      'telegram',
      'discord',
      'spotify',
    ];

    nonBrowserNames.forEach(name => {
      expect(isDirectoryWebBrowserRelated(name)).toBe(false);
    });
  });

  it('should return false for empty string', () => {
    expect(isDirectoryWebBrowserRelated('')).toBe(false);
  });
});
