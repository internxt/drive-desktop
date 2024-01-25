import path from 'path';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';

describe('Path', () => {
  describe('path instantiation', () => {
    it('extracts the parent folder path', () => {
      const folderPath = new FolderPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe(path.posix.sep);
    });
  });
});
