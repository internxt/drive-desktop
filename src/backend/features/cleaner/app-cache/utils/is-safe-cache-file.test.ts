import { isSafeCacheFileType } from './is-safe-cache-file';

describe('isSafeCacheFileType', () => {
  describe('should return false for critical file extensions', () => {
    test.each([
      '.lock',
      '.pid',
      '.db',
      '.sqlite',
      '.sqlite3',
      '.sock',
      '.socket',
    ])('should return false for %s files', (extension) => {
      const fileName = `test${extension}`;
      expect(isSafeCacheFileType(fileName)).toBe(false);
    });

    it('should handle uppercase extensions', () => {
      expect(isSafeCacheFileType('test.LOCK')).toBe(false);
      expect(isSafeCacheFileType('test.DB')).toBe(false);
      expect(isSafeCacheFileType('test.PID')).toBe(false);
    });
  });

  describe('should return false for critical filename keywords', () => {
    test.each(['session', 'state', 'preferences'])(
      'should return false for files containing %s',
      (keyword) => {
        expect(isSafeCacheFileType(`${keyword}.dat`)).toBe(false);
        expect(isSafeCacheFileType(`user-${keyword}.json`)).toBe(false);
        expect(isSafeCacheFileType(`app-${keyword}-config`)).toBe(false);
      }
    );

    it('should handle uppercase keywords', () => {
      expect(isSafeCacheFileType('SESSION.dat')).toBe(false);
      expect(isSafeCacheFileType('user-STATE.json')).toBe(false);
      expect(isSafeCacheFileType('PREFERENCES.xml')).toBe(false);
    });
  });
  it('should handle multiple dots', () => {
    expect(isSafeCacheFileType('app.session.backup.db')).toBe(false); // .db extension
    expect(isSafeCacheFileType('user-preferences-old.txt')).toBe(false); // preferences keyword
    expect(isSafeCacheFileType('data.v1.2.3.cache')).toBe(true); // Safe
  });
});
