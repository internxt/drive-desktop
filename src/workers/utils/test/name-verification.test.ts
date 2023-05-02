import { fileNameIsValid } from '../name-verification';
import sensibleFiles from './sensible-files.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

describe('name verifiaction test', () => {
  const INVALID = false;
  const VALID = true;

  describe('sensible files', () => {
    it.each(sensibleFiles.unix)(
      'sensible unix files are not valid',
      (fileName) => expect(fileNameIsValid(fileName)).toBe(INVALID)
    );

    it.each(sensibleFiles.windows)(
      'sensible windows files are not valid',
      (fileName) => expect(fileNameIsValid(fileName)).toBe(INVALID)
    );

    it.each(sensibleFiles['logs-linux'])(
      'linux logs are not valid',
      (fileName) => expect(fileNameIsValid(fileName)).toBe(INVALID)
    );
  });

  describe('firts level files', () => {
    it('parent folder is not valid', () => {
      const maliciousFileName = '../file.txt';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });

    it('file name with null character are not valid', () => {
      const maliciousFileName = 'secret.doc\0.pdf';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });

    it('root unix folder is not valid', () => {
      const maliciousFileName = '/filename.txt';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });

    it('root windows folder with slash is not valid', () => {
      const maliciousFileName = 'C:/filename.txt';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });
    it('root windows folder with back slash is not valid', () => {
      const maliciousFileName = 'C:\\filename.txt';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });
  });

  describe('second level files', () => {
    it('second level files contain relative path', () => {
      const secondLevelFile = 'memes/cat.jpg';

      const result = fileNameIsValid(secondLevelFile);

      expect(result).toBe(VALID);
    });

    it('second level files cannot include previous folder', () => {
      const secondLevelFile = 'memes/../cat.jpg';

      const result = fileNameIsValid(secondLevelFile);

      expect(result).toBe(INVALID);
    });

    it('second level files cannot include windows root folder', () => {
      const secondLevelFile = 'memes/c:/cat.jpg';

      const result = fileNameIsValid(secondLevelFile);

      expect(result).toBe(INVALID);
    });

    it('second level files cannot include windows with backslash root folder', () => {
      const secondLevelFile = 'memes/c:\\cat.jpg';

      const result = fileNameIsValid(secondLevelFile);

      expect(result).toBe(INVALID);
    });
  });

  describe('windows file system', () => {
    let originalPathSeparation: string;

    beforeAll(() => {
      originalPathSeparation = path.sep as string;
      path.sep = '\\';
    });

    afterAll(() => {
      path.sep = originalPathSeparation;
    });

    it('startup folder is not valid', () => {
      const maliciousFileName =
        '..App\\DataRoaming\\MicrosoftWindows\\Start Menu\\Programs\\Startup';

      const result = fileNameIsValid(maliciousFileName);

      expect(result).toBe(INVALID);
    });

    it('second level files on windows are valid', () => {
      const fileName = 'folder_name\\my-image.jpg';

      const result = fileNameIsValid(fileName);

      expect(result).toBe(VALID);
    });

    describe('n level files', () => {
      const correctWindowsFiles = [
        'folder_name\\my-images\\cat.jpg',
        'cat.jpg',
        'folder_name\\my-images\\february\\cat.jpg',
        'folder_name\\my-image.jpg',
      ];

      it.each(correctWindowsFiles)(
        'valid paths are correctly validated',
        (fileName: string) => {
          const result = fileNameIsValid(fileName);

          expect(result).toBe(VALID);
        }
      );
    });
  });
});
