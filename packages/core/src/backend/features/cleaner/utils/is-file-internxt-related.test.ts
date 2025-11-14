import { isInternxtRelated } from './is-file-internxt-related';

describe('isInternxtRelated', () => {
  it.each([
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
  ])('should return true for internxt pattern: "%s"', (name) => {
    expect(isInternxtRelated({ name })).toBe(true);
  });

  it.each(['drive-desktop', 'Drive-Desktop', 'DRIVE-DESKTOP', 'drive-desktop-linux', 'my-drive-desktop-app', '/var/log/drive-desktop.log'])(
    'should return true for drive-desktop pattern: "%s"',
    (name) => {
      expect(isInternxtRelated({ name })).toBe(true);
    },
  );

  it.each(['google-chrome', 'firefox', 'application.log', 'temp-file.txt', 'system-cache', '/random/random-file'])(
    'should return false for non-internxt related name: "%s"',
    (name) => {
      expect(isInternxtRelated({ name })).toBe(false);
    },
  );

  it('should return false for empty string', () => {
    expect(isInternxtRelated({ name: '' })).toBe(false);
  });
});
