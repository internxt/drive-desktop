/**TODO: DELETE DEAD CODE */
const itemIsOnFolder = (pathLike: string): boolean => pathLike.includes('/');

const extractFilePath = (fileName: string): string =>
  fileName.substring(0, fileName.lastIndexOf('/'));

const sanitazeRelativePath = (relativePath: string) =>
  relativePath.replaceAll('\\', '/');

export function itemIsInFolder(
  foldersName: Array<string>
): (fileName: string) => boolean {
  const sanitazedFolderPaths = foldersName.map((foldersPath: string) =>
    sanitazeRelativePath(foldersPath)
  );

  return (fileName: string) => {
    const sanitazedFilePath = sanitazeRelativePath(fileName);
    if (!itemIsOnFolder(sanitazedFilePath)) {
      return false;
    }

    const filePath = extractFilePath(sanitazedFilePath);

    return sanitazedFolderPaths.includes(filePath);
  };
}
