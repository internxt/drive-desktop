import { fileIsInFolder } from '../file-is-on-folder';

describe('file is on folder', () => {
  const folderPaths = ['folder', 'folder/subfolder', 'two/level/subfolder'];
  let SUT: (fileName: string) => boolean;

  beforeAll(() => {
    SUT = fileIsInFolder(folderPaths);
  });

  const filesInFoldersPaths = [
    'folder/text.pdf',
    'folder/subfolder/image.png',
    'two/level/subfolder/calc.xls',
  ];

  it.each(filesInFoldersPaths)(
    'file on any level should be found',
    (fileName: string) => {
      const result = SUT(fileName);

      expect(result).toBe(true);
    }
  );

  it('file not in any path should not be found', () => {
    const fileName = 'another/path/file.txt';

    const result = SUT(fileName);

    expect(result).toBe(false);
  });

  it('file in root should not be found', () => {
    const fileName = 'rootFile.html';

    const result = SUT(fileName);

    expect(result).toBe(false);
  });
});
