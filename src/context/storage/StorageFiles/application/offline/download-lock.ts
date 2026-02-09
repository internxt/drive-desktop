const downloadingFiles: Map<string, Promise<void>> = new Map();

export function getDownloadLock(fileId: string): Promise<void> | undefined {
  return downloadingFiles.get(fileId);
}

export function setDownloadLock(fileId: string, promise: Promise<void>): void {
  downloadingFiles.set(fileId, promise);

  promise.finally(() => {
    downloadingFiles.delete(fileId);
  });
}
