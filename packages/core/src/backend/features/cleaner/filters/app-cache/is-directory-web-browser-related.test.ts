import { isDirectoryWebBrowserRelated } from './is-directory-web-browser-related';

describe('isDirectoryWebBrowserRelated', () => {
  it.each(['google', 'chromium'])('should return true for exact browser folder names: %s', (folderName) => {
    expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
  });

  it.each(['Google', 'CHROMIUM'])('should return true for browser names with case variations: %s', (folderName) => {
    expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
  });

  it.each(['google-stable', 'chromium-browser'])('should return true for folders containing browser names: %s', (folderName) => {
    expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
  });

  it('should return false for non-browser folder names', () => {
    expect(isDirectoryWebBrowserRelated({ folderName: 'vscode' })).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(isDirectoryWebBrowserRelated({ folderName: '' })).toBe(false);
  });
});
