import { dialog } from 'electron';
import type { OpenDialogOptions } from 'electron';
import path from 'node:path';
import { PathTypeChecker } from '../../apps/shared/fs/PathTypeChecker ';
import type { PathInfo } from '../../context/shared/domain/system-path/PathInfo';

type Props = {
  allowFiles?: boolean;
};

export async function getMultiplePathsFromDialog({ allowFiles = false }: Props = {}): Promise<PathInfo[] | null> {
  const properties: NonNullable<OpenDialogOptions['properties']> = [
    'multiSelections',
    allowFiles ? 'openFile' : 'openDirectory',
  ];

  const result = await dialog.showOpenDialog({ properties });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const paths = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const isFolder = await PathTypeChecker.isFolder(filePath);
      const itemName = path.basename(filePath);

      return {
        path: filePath,
        itemName,
        isDirectory: isFolder,
      };
    }),
  );

  return paths;
}
