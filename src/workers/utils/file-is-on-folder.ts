const fileIsOnFolder = (fileName: string): boolean => fileName.includes('/');

const extractFilePath = (fileName: string): string =>
  fileName.substring(0, fileName.lastIndexOf('/'));

export function fileIsInFolder(
  foldersName: Array<string>
): (fileName: string) => boolean {
  return (fileName: string) => {
    if (!fileIsOnFolder(fileName)) return false;

    const filePath = extractFilePath(fileName);

    return foldersName.includes(filePath);
  };
}
