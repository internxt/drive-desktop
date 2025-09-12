import { isInternxtRelated } from './is-file-internxt-related';

describe('isInternxtRelated', () => {
  it('should return true for internxt pattern (case insensitive)', () => {
    const internxtNames = [
      'internxt',
      'Internxt',
      'INTERNXT',
      'internxt-app',
      'my-internxt-folder',
      '/home/user/.cache/internxt',
      'internxt-drive',
      'internxtlike',
      'notinternxt',
      '/home/user/.local/share/internxt/cache',
      '~/.cache/drive-desktop/logs',
      '/var/log/internxt-desktop.log',
      './internxt-temp-files',
      '/home/user/.config/internxt/logs',
    ];

    internxtNames.forEach(name => {
      expect(isInternxtRelated(name)).toBe(true);
    });
  });

  it('should return true for drive-desktop pattern (case insensitive)', () => {
    const driveDesktopNames = [
      'drive-desktop',
      'Drive-Desktop',
      'DRIVE-DESKTOP',
      'drive-desktop-linux',
      'my-drive-desktop-app',
      '/var/log/drive-desktop.log',
    ];

    driveDesktopNames.forEach(name => {
      expect(isInternxtRelated(name)).toBe(true);
    });
  });

  it('should return false for non-internxt related names', () => {
    const nonInternxtNames = [
      'google-chrome',
      'firefox',
      'application.log',
      'temp-file.txt',
      'system-cache',
      '/tmp/random-file'
    ];

    nonInternxtNames.forEach(name => {
      expect(isInternxtRelated(name)).toBe(false);
    });
  });

  it('should return false for empty string', () => {
    expect(isInternxtRelated('')).toBe(false);
  });
});
