import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export const REMOVABLE_PATH_PREFIXES = ['/media/', '/run/media/', '/mnt/'];

export const OTHER_CLOUD_PROVIDER_KEYWORDS = [
  'dropbox',
  'google drive',
  'onedrive',
  'icloud',
  'mega',
  'pcloud',
  'nextcloud',
  'owncloud',
  'syncthing',
  'proton drive',
];

export type ChooseSyncRootFailureCode =
  | 'REMOVABLE_DEVICE'
  | 'OTHER_CLOUD_PROVIDER'
  | 'INSUFFICIENT_PERMISSION'
  | 'UNKNOWN';

type ValidateRootFolderChangePops = {
  pathname: string;
  virtualDriveFolderName: string;
};

type ValidationErrorResult = {
  status: 'error';
  code: ChooseSyncRootFailureCode;
};

export async function validateRootFolderChange({
  pathname,
  virtualDriveFolderName,
}: ValidateRootFolderChangePops): Promise<ValidationErrorResult | null> {
  const resolvedPath = path.resolve(pathname);

  if (isPathInsideRemovableDevice(resolvedPath)) {
    return { status: 'error', code: 'REMOVABLE_DEVICE' };
  }

  if (isPathInsideOtherCloudProvider(resolvedPath)) {
    return { status: 'error', code: 'OTHER_CLOUD_PROVIDER' };
  }

  const hasPermissions = await canAccessFolderForMount({
    basePath: resolvedPath,
    virtualDriveFolderName,
  });

  if (!hasPermissions) {
    return { status: 'error', code: 'INSUFFICIENT_PERMISSION' };
  }

  return null;
}

export function isPermissionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorCode = 'code' in error ? error.code : undefined;

  return errorCode === 'EACCES' || errorCode === 'EPERM';
}

function isPathInsideRemovableDevice(pathname: string) {
  const normalizedPath = normalizeForPrefixCheck(pathname);

  return REMOVABLE_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}

function isPathInsideOtherCloudProvider(pathname: string) {
  const normalizedPath = pathname.toLowerCase();

  return OTHER_CLOUD_PROVIDER_KEYWORDS.some((providerKeyword) => normalizedPath.includes(providerKeyword));
}

async function canAccessFolderForMount({
  basePath,
  virtualDriveFolderName,
}: {
  basePath: string;
  virtualDriveFolderName: string;
}) {
  try {
    const mountPath = path.join(basePath, virtualDriveFolderName);

    await fs.access(basePath, constants.R_OK | constants.W_OK | constants.X_OK);
    await fs.mkdir(mountPath, { recursive: true });
    await fs.access(mountPath, constants.R_OK | constants.W_OK | constants.X_OK);

    return true;
  } catch (error) {
    if (isPermissionError(error)) {
      return false;
    }

    throw error;
  }
}

function normalizeForPrefixCheck(pathname: string) {
  const resolvedPath = path.resolve(pathname);
  return resolvedPath.endsWith(path.sep) ? resolvedPath : resolvedPath + path.sep;
}
