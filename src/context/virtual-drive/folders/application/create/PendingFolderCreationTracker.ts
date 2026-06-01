import { posix } from 'node:path';

type ActionProps<T> = {
  path: string;
  action: () => Promise<T>;
};

const pendingFolderCreationByPath = new Map<string, Promise<void>>();

function normalizePath(path: string): string {
  const normalizedPath = posix.normalize(path);

  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    return normalizedPath.slice(0, -1);
  }

  return normalizedPath;
}

function getParentPaths(path: string): string[] {
  const normalizedPath = normalizePath(path);
  const parentPaths: string[] = [];

  let currentPath = posix.dirname(normalizedPath);

  while (currentPath !== '.' && currentPath !== '/') {
    parentPaths.unshift(currentPath);
    currentPath = posix.dirname(currentPath);
  }

  return parentPaths;
}

function getPendingParentCreations(path: string): Promise<void>[] {
  const parentPaths = getParentPaths(path);

  return parentPaths
    .map((parentPath) => pendingFolderCreationByPath.get(parentPath))
    .filter((pending): pending is Promise<void> => Boolean(pending));
}

function track<T>(path: string, creationPromise: Promise<T>): void {
  const normalizedPath = normalizePath(path);

  const pendingPromise = creationPromise.then(() => undefined).catch(() => undefined);

  pendingFolderCreationByPath.set(normalizedPath, pendingPromise);

  void pendingPromise.finally(() => {
    if (pendingFolderCreationByPath.get(normalizedPath) === pendingPromise) {
      pendingFolderCreationByPath.delete(normalizedPath);
    }
  });
}

export async function runAfterParentCreations<T>({ path, action }: ActionProps<T>): Promise<T> {
  const pendingParentCreations = getPendingParentCreations(path);

  if (pendingParentCreations.length > 0) {
    await Promise.all(pendingParentCreations);
  }

  return action();
}

export async function runTrackingCreation<T>({ path, action }: ActionProps<T>): Promise<T> {
  const pendingParentCreations = getPendingParentCreations(path);

  if (pendingParentCreations.length > 0) {
    await Promise.all(pendingParentCreations);
  }

  const creationPromise = action();
  track(path, creationPromise);

  return creationPromise;
}

export function clearPendingCreations(): void {
  pendingFolderCreationByPath.clear();
}
