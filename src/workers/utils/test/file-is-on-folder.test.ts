import { itemIsInFolder } from '../file-is-on-folder';

describe('file is on folder', () => {
  const deletedfolders = [
    'folder',
    'folder/subfolder',
    'two/level/subfolder',
    'windows\\subfolder',
  ];
  let SUT: (fileName: string) => boolean;

  beforeAll(() => {
    SUT = itemIsInFolder(deletedfolders);
  });

  const filesInFoldersPaths = [
    'folder/text.pdf',
    'folder/subfolder/image.png',
    'two/level/subfolder/calc.xls',
    'folder\\my-image.jpg',
    'windows/subfolder/test.png',
    'windows\\subfolder\\test.png',
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

  const filesNames = [
    'two/image.png',
    'two/another-folder/file.txt',
    'two/level/another-folder/file.txt',
  ];

  it.each(filesNames)(
    'file with some part of the path in common with deleted folder should not be found',
    (fileName: string) => {
      const result = SUT(fileName);

      expect(result).toBe(false);
    }
  );

  it('file in a subfolder of a deleted folder should not be found', () => {
    const fileName = 'two/level/subfolder/anotherSubfolder/file.txt';

    const result = SUT(fileName);

    expect(result).toBe(false);
  });

  it('folders path is empty folder is not found', () => {
    const filter = itemIsInFolder([]);
    const fileName = 'folder/file.txt';

    const result = filter(fileName);

    expect(result).toBe(false);
  });
});
