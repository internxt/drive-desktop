import path from 'path';
import { AbsolutePathToRelativeConverter } from '../../application/AbsolutePathToRelativeConverter';

describe('AbsolutePathToRelativeConverter', () => {
  if (path.delimiter === path.win32.delimiter) {
    it('works', () => {
      const absolute = 'C\\:Users\\JWcer\\InternxtDrive\\\\New folder (4)\\';

      const sut = new AbsolutePathToRelativeConverter(
        'C\\:Users\\JWcer\\InternxtDrive'
      );

      const relative = sut.run(absolute);

      expect(relative).toBe('\\New folder (4)');
    });
  }
});
