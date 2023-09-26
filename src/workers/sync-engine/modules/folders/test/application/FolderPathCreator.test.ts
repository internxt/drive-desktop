import path from 'path';
import { FolderPathFromAbsolutePathCreator } from '../../application/FolderPathFromAbsolutePathCreator';

describe('Folder Phat Creator', () => {
  describe('Create from absolute', () => {
    it('works', () => {
      const ab = 'C\\:Users\\JWcer\\InternxtDrive\\\\New folder (4)\\';

      const sut = new FolderPathFromAbsolutePathCreator(
        'C\\:Users\\JWcer\\InternxtDrive'
      );

      const result = sut.run(ab);

      expect(result.value).toBe('New folder (4)');
      expect(path.dirname(result.value)).toBe('.');
      expect(result.dirname()).toBe(path.sep);
    });
  });
});
