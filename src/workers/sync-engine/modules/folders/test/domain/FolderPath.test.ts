import { FolderPath } from '../../domain/FolderPath';
import { PlatformPathConverter } from '../../../shared/test/helpers/PlatformPathConverter';
import path from 'path';

describe('Path', () => {
  describe('path instantiation', () => {
    it('path from parts creates expected result', () => {
      const parts = [path.sep, 'Family'];

      const folderPath = FolderPath.fromParts(parts);

      expect(folderPath.value).toBe(
        PlatformPathConverter.convertAnyToCurrent('/Family')
      );
    });

    it('extracts the parent folder path', () => {
      const folderPath = new FolderPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe(path.sep);
    });
  });
});
