const isMainProcess = process.type === 'browser';

/**
 * Gets new API headers via IPC or direct call based on process type
 * @returns Promise resolving to the API headers object
 */
export async function getNewApiHeadersIPC(): Promise<Record<string, string>> {
  if (isMainProcess) {
    const { getNewApiHeaders } = await import('../../apps/main/auth/service');
    return getNewApiHeaders();
  } else {
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke('get-headers-for-new-api');
  }
}
