import { FolderPath } from '../../domain/FolderPath';
import path from 'path';

describe('Path', () => {
  describe('path instantiation', () => {
    it('extracts the parent folder path', () => {
      const folderPath = new FolderPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe(path.posix.sep);
    });
  });
});
