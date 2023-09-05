import { FilePath } from '../../domain/FilePath';
import { PlatformPathConverter } from '../../../shared/test/helpers/PlatformPathConverter';
import path from 'path';

describe('Path', () => {
  describe('path instanciation', () => {
    it('path from parts creates expected result', () => {
      const parts = [path.sep, 'Family'];

      const filePath = FilePath.fromParts(parts);

      expect(filePath.value).toBe(
        PlatformPathConverter.convertAnyToCurrent('/Family')
      );
    });

    it('works', () => {
      const folderPath = new FilePath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe(path.sep);
    });
  });

  describe('extension handeling', () => {
    describe('files without extension', () => {
      it('when a file has no extension hasExtension returns false', () => {
        const path = new FilePath('/folder/file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has no extension hasExtension returns false', () => {
        const path = new FilePath('/folder/.file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has extension extension returns the extension', () => {
        const path = new FilePath('/folder/.file.txt');

        expect(path.extension()).toBe('txt');
      });

      it('when a file starts with a dot and has extension hasExtension returns true', () => {
        const path = new FilePath('/folder/.file.txt');

        expect(path.hasExtension()).toBe(true);
      });
    });
  });
});
