import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { isPermissionError } from '../utils/isPermissionError';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const getFilesFromDirectory = async (dir: string, cb: (file: string) => Promise<void>): Promise<void | null> => {
  let items: Dirent[];
  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    cb(dir);
    return;
  }

  try {
    items = await readdir(dir, { withFileTypes: true });
    // console.log('ITEMS: ', items);
  } catch (err) {
    const error = err;

    if (isPermissionError(error)) {
      console.warn(`Skipping directory "${dir}" due to permission error.`);
      return null;
    }
    throw err;
  }

  const nonTempItems = items.filter((item) => {
    const fullPath = resolve(dir, item.name);
    const isTempFileOrFolder = fullPath.toLowerCase().includes('temp') || fullPath.toLowerCase().includes('tmp');
    return !isTempFileOrFolder;
  });

  for (const item of nonTempItems) {
    const fullPath = resolve(dir, item.name);
    if (item.isDirectory()) {
      try {
        const subitems = await readdir(fullPath, { withFileTypes: true });
        if (subitems.length > 0) {
          await getFilesFromDirectory(fullPath, cb);
        }
      } catch (err) {
        if (!isPermissionError(err)) {
          throw err;
        }
        console.warn(`Skipping subdirectory "${fullPath}" due to permission error.`);
      }
    } else {
      cb(fullPath);
    }
  }
};

export async function countFilesUsingWindowsCommand(folder: string): Promise<number> {
  const command = `powershell -command "Get-ChildItem -Path '${folder}' -File -Recurse | Measure-Object | Select -ExpandProperty Count"`;
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error('Error de PowerShell:', stderr);
    }
    return parseInt(stdout.trim(), 10);
  } catch (err) {
    console.error('Error al contar archivos con PowerShell:', err);
    return 0;
  }
}
