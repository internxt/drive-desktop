import { isValidInternxtDrivePath, normalizeWindowsPath } from './utils';

describe('share-utils', () => {
  describe('normalizeWindowsPath', () => {
    it('should normalize separators, path segments, and casing', () => {
      expect(normalizeWindowsPath(String.raw`C:/Users/abc/InternxtDrive/folder/../File.txt`)).toBe(
        String.raw`c:\users\abc\internxtdrive\file.txt`,
      );
    });
  });

  describe('isValidInternxtDrivePath', () => {
    const rootPath = String.raw`c:\users\abc\internxtdrive`;

    it('should accept a direct child of the sync root', () => {
      expect(isValidInternxtDrivePath(String.raw`c:\users\abc\internxtdrive\file.txt`, rootPath)).toBe(true);
    });

    it('should accept a nested descendant of the sync root', () => {
      expect(isValidInternxtDrivePath(String.raw`c:\users\abc\internxtdrive\folder\document.pdf`, rootPath)).toBe(true);
    });

    it('should reject the sync root itself', () => {
      expect(isValidInternxtDrivePath(rootPath, rootPath)).toBe(false);
    });

    it('should reject the parent of the sync root', () => {
      expect(isValidInternxtDrivePath(String.raw`c:\users\abc`, rootPath)).toBe(false);
    });

    it('should reject a sibling path with the same text prefix', () => {
      expect(isValidInternxtDrivePath(String.raw`c:\users\abc\internxtdrive-copy\file.txt`, rootPath)).toBe(false);
    });

    it('should reject a path on another drive', () => {
      expect(isValidInternxtDrivePath(String.raw`d:\internxtdrive\file.txt`, rootPath)).toBe(false);
    });
  });
});
