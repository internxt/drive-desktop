export interface FolderTreeResponse {
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
}

export async function fetchFolderTree(
  folderUuid: string
): Promise<FolderTreeResponse> {
  const res = await fetch(
    `${process.env.NEW_DRIVE_URL}/drive/folders/${folderUuid}/tree`,
    {
      method: 'GET',
      headers: getNewApiHeaders(),
    }
  );

  if (res.ok) {
    const { tree } = (await res.json()) as unknown as { tree: FolderTree };

    let size = 0;
    const folderDecryptedNames: Record<number, string> = {};
    const fileDecryptedNames: Record<number, string> = {};

    // ! Decrypts folders and files names
    const pendingFolders = [tree];
    while (pendingFolders.length > 0) {
      const currentTree = pendingFolders[0];
      const { folders, files } = {
        folders: currentTree.children,
        files: currentTree.files,
      };

      folderDecryptedNames[currentTree.id] = currentTree.plainName;

      for (const file of files) {
        fileDecryptedNames[file.id] = aes.decrypt(
          file.name,
          `${process.env.NEW_CRYPTO_KEY}-${file.folderId}`
        );
        size += Number(file.size);
      }

      pendingFolders.shift();

      // * Adds current folder folders to pending
      pendingFolders.push(...folders);
    }

    return { tree, folderDecryptedNames, fileDecryptedNames, size };
  } else {
    throw new Error('Unsuccesful request to fetch folder tree');
  }
}

export async function fetchArrayFolderTree(
  folderUuids: string[]
): Promise<FolderTreeResponse> {
  const trees: FolderTree[] = [];
  const folderDecryptedNames: Record<number, string> = {};
  const fileDecryptedNames: Record<number, string> = {};
  let size = 0;

  for (const folderUuid of folderUuids) {
    const res = await fetch(
      `${process.env.NEW_DRIVE_URL}/drive/folders/${folderUuid}/tree`,
      {
        method: 'GET',
        headers: getNewApiHeaders(),
      }
    );

    if (res.ok) {
      const response = (await res.json()) as unknown as { tree: FolderTree };
      trees.push(response.tree);

      // ! Decrypts folders and files names
      const pendingFolders = [response.tree];
      while (pendingFolders.length > 0) {
        const currentTree = pendingFolders[0];
        const { folders, files } = {
          folders: currentTree.children,
          files: currentTree.files,
        };

        folderDecryptedNames[currentTree.id] = currentTree.plainName;

        for (const file of files) {
          fileDecryptedNames[file.id] = aes.decrypt(
            file.name,
            `${process.env.NEW_CRYPTO_KEY}-${file.folderId}`
          );
          size += Number(file.size);
        }

        pendingFolders.shift();

        // * Adds current folder folders to pending
        pendingFolders.push(...folders);
      }
    } else {
      throw new Error(
        `Unsuccessful request to fetch folder tree for ID: ${folderUuid}`
      );
    }
  }

  let tree: FolderTree = trees[0];
  if (trees.length > 1) {
    tree = {
      id: 0,
      bucket: trees[0].bucket,
      children: trees,
      encrypt_version: trees[0].encrypt_version,
      files: trees.map((t) => t.files).flat(), // * Flattens files;
      name: 'Multiple Folders',
      plainName: 'Multiple Folders',
      parentId: 0,
      userId: trees[0].userId,
      uuid: randomUUID(),
      parentUuid: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: size,
      type: 'folder',
      deleted: false,
      removed: false,
    };
  }

  return { tree, folderDecryptedNames, fileDecryptedNames, size };
}
