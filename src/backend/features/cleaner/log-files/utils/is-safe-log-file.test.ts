import { isSafeLogFile, logFileFilter } from './is-safe-log-file';

describe('is-safe-log-file', () => {
  describe('isSafeLogFile', () => {
    it('should return true for safe log file extensions', () => {
      const safeLogFiles = [
        'application.log',
        'debug.txt',
        'output.out',
        'error.err',
        'trace.trace',
        'debug.debug',
        'info.info',
        'warn.warn',
        'error.error'
      ];

      safeLogFiles.forEach(fileName => {
        expect(isSafeLogFile(fileName)).toBe(true);
      });
    });

    it('should return true for compressed log files', () => {
      const compressedLogs = [
        'application.log.gz',
        'system.log.bz2',
        'debug.log.xz',
        'backup.log.zip'
      ];

      compressedLogs.forEach(fileName => {
        expect(isSafeLogFile(fileName)).toBe(true);
      });
    });

    it('should return true for case insensitive extensions', () => {
      const caseVariations = [
        'app.LOG',
        'debug.TXT',
        'error.GZ',
        'trace.BZ2'
      ];

      caseVariations.forEach(fileName => {
        expect(isSafeLogFile(fileName)).toBe(true);
      });
    });

    it('should return false for unsafe file extensions', () => {
      const unsafeFiles = [
        'config.db',
        'process.pid',
        'app.lock',
        'session.sqlite',
        'socket.sock',
        'binary.exe',
        'script.sh'
      ];

      unsafeFiles.forEach(fileName => {
        expect(isSafeLogFile(fileName)).toBe(false);
      });
    });

    it('should return false for files without extensions', () => {
      const noExtensionFiles = [
        'logfile',
        'debug',
        'output'
      ];

      noExtensionFiles.forEach(fileName => {
        expect(isSafeLogFile(fileName)).toBe(false);
      });
    });
  });

  describe('logFileFilter', () => {
    it('should return false for safe log files (include them)', () => {
      expect(logFileFilter('application.log')).toBe(false);
      expect(logFileFilter('debug.txt')).toBe(false);
      expect(logFileFilter('error.gz')).toBe(false);
    });

    it('should return true for unsafe files (exclude them)', () => {
      expect(logFileFilter('config.db')).toBe(true);
      expect(logFileFilter('process.pid')).toBe(true);
      expect(logFileFilter('app.lock')).toBe(true);
    });
  });
});