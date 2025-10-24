import { AbsolutePath, pathUtils } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('parsePath', () => {
    expect(pathUtils.parsePath({ path: '/' })).toBe('/');
    expect(pathUtils.parsePath({ path: '\\' })).toBe('/');
    expect(pathUtils.parsePath({ path: '\\\\//a//\\\\' })).toBe('/a');
  });

  it('createRelativePath', () => {
    expect(pathUtils.createRelativePath()).toBe('/');
    expect(pathUtils.createRelativePath('', '')).toBe('/');
    expect(pathUtils.createRelativePath('.', '.')).toBe('/');
    expect(pathUtils.createRelativePath('..', '..')).toBe('/');
    expect(pathUtils.createRelativePath('a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('/a/', '/b/c/')).toBe('/a/b/c');
  });

  it('createAbsolutePath', () => {
    expect(pathUtils.createAbsolutePath('C:\\Users\\user', 'InternxtDrive')).toBe('C:/Users/user/InternxtDrive');
    expect(pathUtils.createAbsolutePath('C:\\Users\\user\\', '\\InternxtDrive\\')).toBe('C:/Users/user/InternxtDrive');
  });

  it('dirname', () => {
    const path = pathUtils.createRelativePath('/a/b/c');
    const newPath = pathUtils.dirname(path);
    expect(newPath).toBe('/a/b');
  });

  it('absoluteToRelative', () => {
    const base = 'C:\\Users\\user' as AbsolutePath;
    const path = 'C:\\Users\\user\\drive\\folder\\file.txt' as AbsolutePath;
    const newPath = pathUtils.absoluteToRelative({ base, path });
    expect(newPath).toBe('/drive/folder/file.txt');
  });
});
