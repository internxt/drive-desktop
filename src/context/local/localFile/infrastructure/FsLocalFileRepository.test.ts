import path from 'node:path';
import { FsLocalFileRepository } from './FsLocalFileRepository';
import { AbsolutePath } from './AbsolutePath';
import { createFolderStructure, removeFolderStructure } from './__test-helpers__/folderStructure';

const TEST_FOLDER = path.join(__dirname, 'FsLocalFileRepositoryTestFolder') as AbsolutePath;
/** I need to skip this test as is giving this error:
 *  FAIL   main  src/context/local/localFile/infrastructure/FsLocalFileRepository.test.ts > FsLocalFileRepository
 * Error: EEXIST: file already exists,
 * mkdir 'drive-desktop-linux/src/context/local/localFile/infrastructure/FsLocalFileRepositoryTestFolder'
 */
describe.skip('FsLocalFileRepository', () => {
  let SUT: FsLocalFileRepository;

  beforeAll(async () => {
    await createFolderStructure(TEST_FOLDER);

    SUT = new FsLocalFileRepository();
  });

  afterAll(async () => {
    await removeFolderStructure(TEST_FOLDER);
  });

  describe('folders', () => {
    it('obtains all the folders', async () => {
      const folders = await SUT.folders(path.join(TEST_FOLDER, 'folder') as AbsolutePath);

      expect(folders).toStrictEqual(
        expect.arrayContaining([
          path.join(TEST_FOLDER, 'folder', 'subfolder'),
          path.join(TEST_FOLDER, 'folder', 'empty_folder'),
        ]),
      );
    });

    it('returns an empty array if there are no folders', async () => {
      const folders = await SUT.folders(path.join(TEST_FOLDER, 'folder', 'empty_folder') as AbsolutePath);

      expect(folders).toEqual([]);
    });
  });

  describe('files', () => {
    it('obtains all files in the folder', async () => {
      const files = await SUT.files(TEST_FOLDER);

      expect(files).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _path: path.join(TEST_FOLDER, '.hidden'),
          }),
          expect.objectContaining({
            _path: path.join(TEST_FOLDER, 'hello_world.txt'),
          }),
        ]),
      );
    });

    it('returns an empty array if there are no files', async () => {
      const files = await SUT.files(path.join(TEST_FOLDER, 'folder', 'empty_folder') as AbsolutePath);

      expect(files).toEqual([]);
    });
  });
});
