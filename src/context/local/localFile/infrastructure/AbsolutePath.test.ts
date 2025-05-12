import { createRelativePath } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('If starts without root', () => {
    expect(createRelativePath()).toBe('/');
    expect(createRelativePath('a')).toBe('/a');
    expect(createRelativePath('/a')).toBe('/a');
    expect(createRelativePath('//a')).toBe('/a');
    expect(createRelativePath('a', 'b')).toBe('/a/b');
    expect(createRelativePath('/a', 'b')).toBe('/a/b');
    expect(createRelativePath('a', '/b')).toBe('/a/b');
    expect(createRelativePath('/a', '/b')).toBe('/a/b');
    expect(createRelativePath('a', 'b/c')).toBe('/a/b/c');
    expect(createRelativePath('/a', 'b/c')).toBe('/a/b/c');
  });

  it('If starts with posix', () => {
    expect(createRelativePath('/')).toBe('/');
    expect(createRelativePath('/', 'a')).toBe('/a');
    expect(createRelativePath('/', '/a')).toBe('/a');
    expect(createRelativePath('/', '//a')).toBe('/a');
    expect(createRelativePath('/', 'a', 'b')).toBe('/a/b');
    expect(createRelativePath('/', '/a', 'b')).toBe('/a/b');
    expect(createRelativePath('/', 'a', '/b')).toBe('/a/b');
    expect(createRelativePath('/', '/a', '/b')).toBe('/a/b');
    expect(createRelativePath('/', 'a', 'b/c')).toBe('/a/b/c');
    expect(createRelativePath('/', 'a', '/b/c')).toBe('/a/b/c');
  });

  it('If starts with win32', () => {
    expect(createRelativePath('\\')).toBe('/');
    expect(createRelativePath('\\', 'a')).toBe('/a');
    expect(createRelativePath('\\', '/a')).toBe('/a');
    expect(createRelativePath('\\', '//a')).toBe('/a');
    expect(createRelativePath('\\', 'a', 'b')).toBe('/a/b');
    expect(createRelativePath('\\', '/a', 'b')).toBe('/a/b');
    expect(createRelativePath('\\', 'a', '/b')).toBe('/a/b');
    expect(createRelativePath('\\', '/a', '/b')).toBe('/a/b');
    expect(createRelativePath('\\', 'a', 'b/c')).toBe('/a/b/c');
    expect(createRelativePath('\\', 'a', '/b/c')).toBe('/a/b/c');
  });

  it('If contains win32', () => {
    expect(createRelativePath('/', '\\a')).toBe('/a');
    expect(createRelativePath('\\', '\\a')).toBe('/a');
    expect(createRelativePath('/', '\\\\a')).toBe('/a');
    expect(createRelativePath('\\', '\\\\a')).toBe('/a');
    expect(createRelativePath('/', '/\\a')).toBe('/a');
    expect(createRelativePath('/', '\\/a')).toBe('/a');
  });
});
