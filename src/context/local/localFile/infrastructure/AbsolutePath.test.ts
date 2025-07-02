import { AbsolutePath, pathUtils, RelativePath } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('createRelativePath', () => {
    expect(pathUtils.createRelativePath()).toBe('/');
    expect(pathUtils.createRelativePath('')).toBe('/');
    expect(pathUtils.createRelativePath('.')).toBe('/');
    expect(pathUtils.createRelativePath('/')).toBe('/');
    expect(pathUtils.createRelativePath('a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\\\////a\\//\\//')).toBe('/a');
    expect(pathUtils.createRelativePath('a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('/a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('\\\\////a\\//\\//', '/b/c', 'd')).toBe('/a/b/c/d');
  });

  it('dirname', () => {
    const path = pathUtils.createRelativePath('/a/b/c');
    const newPath = pathUtils.dirname(path);
    expect(newPath).toBe('/a/b');
    expectTypeOf(newPath).toEqualTypeOf<RelativePath>();
  });

  it('absoluteToRelative', () => {
    const base = 'C:\\Users\\user' as AbsolutePath;
    const path = 'C:\\Users\\user\\drive\\folder\\file.txt' as AbsolutePath;
    const newPath = pathUtils.absoluteToRelative({ base, path });
    expect(newPath).toBe('/drive/folder/file.txt');
    expectTypeOf(newPath).toEqualTypeOf<RelativePath>();
  });
});
