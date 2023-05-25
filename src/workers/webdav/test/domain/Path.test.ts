import { XPath } from '../../domain/XPath';

describe('Path', () => {
  describe('extension handeling', () => {
    describe('files without extension', () => {
      it('when a file has no extension hasExtension returns false', () => {
        const path = new XPath('/folder/file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has no extension hasExtension returns false', () => {
        const path = new XPath('/folder/.file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has extension extension returns the extension', () => {
        const path = new XPath('/folder/.file.txt');

        expect(path.extension()).toBe('txt');
      });

      it('when a file starts with a dot and has extension hasExtension returns true', () => {
        const path = new XPath('/folder/.file.txt');

        expect(path.hasExtension()).toBe(true);
      });
    });
  });
});
