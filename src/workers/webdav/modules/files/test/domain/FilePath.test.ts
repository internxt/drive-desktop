import { FilePath } from '../../domain/FilePath';

describe('Path', () => {
  describe('path instanciation', () => {
    it('path from parts creates expected result', () => {
      const parts = ['/', 'Family'];

      const path = FilePath.fromParts(parts);

      expect(path.value).toBe('/Family');
    });

    it('works', () => {
      const folderPath = new FilePath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe('/');
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
