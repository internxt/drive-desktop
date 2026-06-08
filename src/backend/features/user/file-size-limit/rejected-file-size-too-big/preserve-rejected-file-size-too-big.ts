import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { PATHS } from '../../../../../core/electron/paths';
import { Result } from '../../../../../context/shared/domain/Result';

type Props = {
  originalPath: string;
  temporalContentPath: string;
  size: number;
  rootFolder?: string;
};

type PreservedRejectedFileSizeTooBig = {
  folderPath: string;
  filePath: string;
};

export async function preserveRejectedFileSizeTooBig({
  originalPath,
  temporalContentPath,
  rootFolder = PATHS.REJECTED_FILES_SIZE_TOO_BIG,
}: Props): Promise<Result<PreservedRejectedFileSizeTooBig, Error>> {
  const recoveredPath = createRecoveredPath({ rootFolder, originalPath });
  const folderPath = path.dirname(recoveredPath);
  try {
    await mkdir(folderPath, { recursive: true });
    const { data: filePath, error } = await copyWithoutOverwriting({
      sourcePath: temporalContentPath,
      targetPath: recoveredPath,
    });

    if (error) {
      return { error };
    }

    return { data: { folderPath: path.dirname(filePath), filePath } };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(`Failed to create directory: ${error}`) };
  }
}

export function createRecoveredPath({
  rootFolder,
  originalPath,
}: {
  rootFolder: string;
  originalPath: string;
}): string {
  const originalPathSegments = originalPath
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  return path.join(rootFolder, ...(originalPathSegments.length ? originalPathSegments : ['rejected-file']));
}

export async function copyWithoutOverwriting({
  sourcePath,
  targetPath,
}: {
  sourcePath: string;
  targetPath: string;
}): Promise<Result<string, Error>> {
  for (let copyNumber = 0; copyNumber <= 101; copyNumber += 1) {
    const candidatePath = createCandidatePath({ targetPath, copyNumber });
    // eslint-disable-next-line no-await-in-loop
    const { data: copiedPath, error } = await tryCopyWithoutOverwriting({ sourcePath, targetPath: candidatePath });

    if (error) {
      return { error };
    }

    if (copiedPath) {
      return { data: copiedPath };
    }
  }
  return {
    error: new Error(`Unable to preserve rejected file because all copy candidates already exist: ${targetPath}`),
  };
}

function createCandidatePath({ targetPath, copyNumber }: { targetPath: string; copyNumber: number }): string {
  if (copyNumber === 0) {
    return targetPath;
  }
  if (copyNumber <= 100) {
    return createCopyPath({ targetPath, copyNumber });
  }
  return createLastResortCopyPath({ targetPath });
}

async function tryCopyWithoutOverwriting({
  sourcePath,
  targetPath,
}: {
  sourcePath: string;
  targetPath: string;
}): Promise<Result<string | undefined, Error>> {
  try {
    await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);
    return { data: targetPath };
  } catch (error) {
    if (isFileAlreadyExistsError(error)) {
      return { data: undefined };
    }
    return { error: error instanceof Error ? error : new Error(`Failed to copy file: ${error}`) };
  }
}

export function createCopyPath({ targetPath, copyNumber }: { targetPath: string; copyNumber: number }): string {
  const parsedPath = path.parse(targetPath);
  return path.join(parsedPath.dir, `${parsedPath.name} (copy ${copyNumber})${parsedPath.ext}`);
}

export function createLastResortCopyPath({ targetPath }: { targetPath: string }): string {
  const parsedPath = path.parse(targetPath);
  const timestamp = Date.now();
  return path.join(parsedPath.dir, `${parsedPath.name} (copy ${timestamp}-${randomInt(1_000_000)})${parsedPath.ext}`);
}

function isFileAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
