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
});
