import { FolderPath } from '../../domain/FolderPath';
import { PlatformPathConverter } from '../../../shared/test/helpers/PlatformPathConverter';

describe('Path', () => {
  describe('path instanciation', () => {
    it('path from parts creates expected result', () => {
      const parts = ['/', 'Family'];

      const path = FolderPath.fromParts(parts);

      expect(path.value).toBe(
        PlatformPathConverter.convertAnyToCurrent('/Family')
      );
    });

    it('extracts the parent folder path', () => {
      const folderPath = new FolderPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe('/');
    });
  });
});
