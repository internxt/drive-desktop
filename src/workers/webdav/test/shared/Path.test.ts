import { WebdavPath } from '../../shared/domain/WebdavPath';

describe('Path', () => {
  describe('path instanciation', () => {
    it('path from parts creates expected result', () => {
      const parts = ['/', 'Family'];

      const path = WebdavPath.fromParts(parts);

      expect(path.value).toBe('/Family');
    });

    it('works', () => {
      const folderPath = new WebdavPath('/Family');

      const basePath = folderPath.dirname();

      expect(basePath).toBe('/');
    });
  });

  describe('extension handeling', () => {
    describe('files without extension', () => {
      it('when a file has no extension hasExtension returns false', () => {
        const path = new WebdavPath('/folder/file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has no extension hasExtension returns false', () => {
        const path = new WebdavPath('/folder/.file');

        expect(path.hasExtension()).toBe(false);
      });

      it('when a file starts with a dot and has extension extension returns the extension', () => {
        const path = new WebdavPath('/folder/.file.txt');

        expect(path.extension()).toBe('txt');
      });

      it('when a file starts with a dot and has extension hasExtension returns true', () => {
        const path = new WebdavPath('/folder/.file.txt');

        expect(path.hasExtension()).toBe(true);
      });
    });
  });
});
