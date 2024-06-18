import path from 'path';
import { AbsolutePath } from '../../../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import fs from 'fs/promises';

export const tree = {
  folder: ['hello_world.txt', '.hidden', 'without_extension'],
  'folder/subfolder': ['myfile.txt'],
  'folder/empty_folder': [],
};

export async function createFolderStructure(
  basePath: AbsolutePath
): Promise<void> {
  const foldersFilesTuple = Object.entries(tree);

  await fs.mkdir(basePath);

  const treeCreation = foldersFilesTuple.map(async ([folder, files]) => {
    await fs.mkdir(path.join(basePath, folder), { recursive: true });

    const write = files.map((file) =>
      fs.writeFile(path.join(basePath, file), 'test file content')
    );

    await Promise.all(write);
  });

  await Promise.all(treeCreation);
}

export async function removeFolderStructure(basePath: AbsolutePath) {
  fs.rmdir(basePath, { recursive: true });
}
