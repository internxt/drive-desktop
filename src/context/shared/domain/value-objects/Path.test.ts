import { Path } from './Path';

class PathTestClass extends Path {
  constructor(value: string) {
    super(value);
  }
}

describe('Path', () => {
  describe('Path must always be posix', () => {
    it('root folder path / is valid', () => {
      const path = '/';

      expect(() => new PathTestClass(path)).not.toThrowError();
    });

    it('throws an error when the path is win32', () => {
      const win32Path = '\\C:\\usersInternxt';

      expect(() => new PathTestClass(win32Path)).toThrowError();
    });
  });
  it.each(['/folder/file.........something', '/f..a.txt', '/f...text'])(
    'path with dots after the first position are valid',
    (path) => {
      expect(() => new PathTestClass(path)).not.toThrowError();
    },
  );
  it('does not mark a path with ":" in the middle as malicious', () => {
    const path = '/My Folder:/file.txt';

    try {
      new PathTestClass(path);
    } catch (err) {
      expect(err).not.toBeDefined();
    }
  });
});
