import { PlatformPathConverter } from './PlatformPathConverter';

describe('PlatformPathConverter', () => {
  it('Convert paths successfully', () => {
    expect(PlatformPathConverter.getFatherPathPosix('')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('.')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('/')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('./')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('/folder1')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('./folder1')).toStrictEqual('/');
    expect(PlatformPathConverter.getFatherPathPosix('folder1/folder2')).toStrictEqual('/folder1');
    expect(PlatformPathConverter.getFatherPathPosix('/folder1/folder2')).toStrictEqual('/folder1');
  });

  describe('winToPosix', () => {
    it('works with a single level', () => {
      const win = '\\New Folder (4)';
      const posix = PlatformPathConverter.winToPosix(win);

      expect(posix).toBe('/New Folder (4)');
    });

    it('works with two levels', () => {
      const win = '\\New Folder (4)\\Subfolder';
      const posix = PlatformPathConverter.winToPosix(win);

      expect(posix).toBe('/New Folder (4)/Subfolder');
    });
  });
});
