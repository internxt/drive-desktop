import { FilePath } from './FilePath';

describe('Path', () => {
  describe('extension handling', () => {
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
