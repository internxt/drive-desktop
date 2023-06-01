import { FolderPath } from '../../domain/FolderPath';

describe('Path', () => {
  describe('path instanciation', () => {
    it('path from parts creates expected result', () => {
      const parts = ['/', 'Family'];

      const path = FolderPath.fromParts(parts);

      expect(path.value).toBe('/Family');
    });

    it('works', () => {
      const folderPath = new FolderPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe('/');
    });
  });
});
