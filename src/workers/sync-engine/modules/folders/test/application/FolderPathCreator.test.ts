import path from 'path';
import { FolderPathCreator } from '../../application/FolderPathCreator';

describe('Folder Phat Creator', () => {
  describe('Create from absolute', () => {
    it('works', () => {
      const ab = 'C\\:Users\\JWcer\\InternxtDrive\\\\New folder (4)\\';

      const sut = new FolderPathCreator('C\\:Users\\JWcer\\InternxtDrive');

      const result = sut.fromAbsolute(ab);

      // TODO: This behavior need to change. Normalize any path that is returned form bindings
      expect(result.value).toBe('\\New folder (4)');
      expect(path.dirname(result.value)).toBe('\\');
      expect(result.dirname()).toBe(path.sep);
    });
  });
});
