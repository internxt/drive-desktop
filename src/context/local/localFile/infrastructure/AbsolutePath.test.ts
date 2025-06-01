import { pathUtils, RelativePath } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('If starts without root', () => {
    expect(pathUtils.createRelativePath()).toBe('/');
    expect(pathUtils.createRelativePath('a')).toBe('/a');
    expect(pathUtils.createRelativePath('/a')).toBe('/a');
    expect(pathUtils.createRelativePath('//a')).toBe('/a');
    expect(pathUtils.createRelativePath('a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('/a', 'b/c')).toBe('/a/b/c');
  });

  it('If starts with posix', () => {
    expect(pathUtils.createRelativePath('/')).toBe('/');
    expect(pathUtils.createRelativePath('/', 'a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', '/a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', '//a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', 'a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/', '/a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/', 'a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/', '/a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('/', 'a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('/', 'a', '/b/c')).toBe('/a/b/c');
  });

  it('If starts with win32', () => {
    expect(pathUtils.createRelativePath('\\')).toBe('/');
    expect(pathUtils.createRelativePath('\\', 'a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\', '/a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\', '//a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\', 'a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('\\', '/a', 'b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('\\', 'a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('\\', '/a', '/b')).toBe('/a/b');
    expect(pathUtils.createRelativePath('\\', 'a', 'b/c')).toBe('/a/b/c');
    expect(pathUtils.createRelativePath('\\', 'a', '/b/c')).toBe('/a/b/c');
  });

  it('If contains win32', () => {
    expect(pathUtils.createRelativePath('/', '\\a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\', '\\a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', '\\\\a')).toBe('/a');
    expect(pathUtils.createRelativePath('\\', '\\\\a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', '/\\a')).toBe('/a');
    expect(pathUtils.createRelativePath('/', '\\/a')).toBe('/a');
  });

  it('If dirname to RelativePath it should return RelativePath', () => {
    const path = pathUtils.createRelativePath('/a/b/c');
    const newPath = pathUtils.dirname(path);
    expect(newPath).toBe('/a/b');
    expectTypeOf(newPath).toEqualTypeOf<RelativePath>();
  });
});
