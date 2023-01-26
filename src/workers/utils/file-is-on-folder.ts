const fileIsOnFolder = (fileName: string): boolean => fileName.includes('/');

const extractFilePath = (fileName: string): string =>
  fileName.substring(0, fileName.lastIndexOf('/'));

const sanitazeRelativePath = (relativePath: string) =>
  relativePath.replaceAll('\\', '/');

export function fileIsInFolder(
  foldersName: Array<string>
): (fileName: string) => boolean {
  const sanitazedFolderPaths = foldersName.map((foldersPath: string) =>
    sanitazeRelativePath(foldersPath)
  );

  return (fileName: string) => {
    const sanitazedFilePath = sanitazeRelativePath(fileName);
    if (!fileIsOnFolder(sanitazedFilePath)) return false;

    const filePath = extractFilePath(sanitazedFilePath);

    return sanitazedFolderPaths.includes(filePath);
  };
}
