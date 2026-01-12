import { ipcMain } from 'electron';

/**
 * Helper function to extract IPC handler from mocked ipcMain
 * @param eventName - The IPC event name to find
 * @param useOn - Whether to search in `on` handlers instead of `handle` handlers
 * @returns The handler function or undefined if not found
 */
export function getIpcHandler(eventName: string, useOn = false) {
  const ipc = ipcMain as unknown as {
    handle: { mock: { calls: Array<[string, (...args: unknown[]) => unknown]> } };
    on: { mock: { calls: Array<[string, (...args: unknown[]) => unknown]> } };
  };
  const calls = useOn ? ipc.on.mock.calls : ipc.handle.mock.calls;
  return calls.find(([name]) => name === eventName)?.[1];
}
