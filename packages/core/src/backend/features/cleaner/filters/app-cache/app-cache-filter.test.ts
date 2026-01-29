import { CleanerContext } from '../../types/cleaner.types';
import { appCacheFileFilter } from './app-cache-filter';

describe('appCacheFileFilter', () => {
  const ctx = {
    appCache: {
      criticalExtensions: ['.lock', '.pid', '.db', '.sqlite', '.sqlite3', '.sock', '.socket'],
      criticalKeywords: ['session', 'state', 'preferences'],
    },
  } as unknown as CleanerContext;

  it.each(['.lock', '.pid', '.db', '.sqlite', '.sqlite3', '.sock', '.socket'])('should return false for %s files', (extension) => {
    const fileName = `test${extension}`;
    expect(appCacheFileFilter({ ctx, fileName })).toBe(false);
  });

  it.each(['.LOCK', '.DB', '.PID'])('should handle uppercase extensions: %s', (extension) => {
    expect(appCacheFileFilter({ ctx, fileName: `test${extension}` })).toBe(false);
  });

  it.each(['session', 'state', 'preferences'])('should return false for files containing %s', (keyword) => {
    expect(appCacheFileFilter({ ctx, fileName: `app-${keyword}-config` })).toBe(false);
  });

  it.each(['SESSION', 'STATE', 'PREFERENCES'])('should handle uppercase keywords: %s', (keyword) => {
    expect(appCacheFileFilter({ ctx, fileName: `test.${keyword}.xml` })).toBe(false);
  });

  it('should handle multiple dots', () => {
    expect(appCacheFileFilter({ ctx, fileName: 'app.session.backup.db' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'user-preferences-old.txt' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'data.v1.2.3.cache' })).toBe(true);
  });
});
