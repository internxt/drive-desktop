import { app, ipcMain } from 'electron';
import { call } from 'tests/vitest/utils.helper';
import * as virtualDriveServiceModule from '../../backend/features/virtual-drive/services/virtual-drive.service';
import { partialSpyOn } from 'tests/vitest/utils.helper';
import * as registerQuitHandlerModule from './quit.handler';

describe('quit', () => {
  const stopVirtualDriveMock = partialSpyOn(virtualDriveServiceModule, 'stopVirtualDrive');
  const appQuitMock = partialSpyOn(app, 'quit');
  const appOnMock = partialSpyOn(app, 'on', false);
  const ipcMainOnMock = partialSpyOn(ipcMain, 'on', false);
  const registerQuitHandlerMock = partialSpyOn(registerQuitHandlerModule, 'registerQuitHandler');

  beforeEach(() => {
    registerQuitHandlerMock.mockRestore();
    stopVirtualDriveMock.mockResolvedValue(undefined);
  });

  it('should register user-quit handler', () => {
    registerQuitHandlerModule.registerQuitHandler();

    call(ipcMainOnMock).toMatchObject(['user-quit', expect.any(Function)]);
  });

  it('should register before-quit handler', () => {
    registerQuitHandlerModule.registerQuitHandler();

    expect(appOnMock).toBeCalledWith('before-quit', expect.any(Function));
  });

  it('should call stopAndClearFuseApp on user-quit event', async () => {
    registerQuitHandlerModule.registerQuitHandler();
    await (ipcMainOnMock.mock.calls[0][1] as () => Promise<void>)();

    expect(stopVirtualDriveMock).toBeCalled();
  });

  it('should call app.quit on user-quit event', async () => {
    registerQuitHandlerModule.registerQuitHandler();
    await (ipcMainOnMock.mock.calls[0][1] as () => Promise<void>)();

    expect(appQuitMock).toBeCalled();
  });

  it('should call cleanup and prevent default on before-quit', async () => {
    registerQuitHandlerModule.registerQuitHandler();

    const beforeQuitHandler = (appOnMock.mock.calls as unknown[][]).find(([event]) => event === 'before-quit')?.[1] as (
      event: Electron.Event,
    ) => void;

    const preventDefault = vi.fn();
    beforeQuitHandler({ preventDefault } as unknown as Electron.Event);
    await Promise.resolve();

    expect(preventDefault).toBeCalled();
    expect(stopVirtualDriveMock).toBeCalled();
    expect(appQuitMock).toBeCalled();
  });

  it('should not run cleanup twice when user-quit and before-quit are both triggered', async () => {
    registerQuitHandlerModule.registerQuitHandler();

    await (ipcMainOnMock.mock.calls[0][1] as () => Promise<void>)();

    const beforeQuitHandler = (appOnMock.mock.calls as unknown[][]).find(([event]) => event === 'before-quit')?.[1] as (
      event: Electron.Event,
    ) => void;

    const preventDefault = vi.fn();
    beforeQuitHandler({ preventDefault } as unknown as Electron.Event);
    await Promise.resolve();

    expect(stopVirtualDriveMock).toBeCalledTimes(1);
    expect(preventDefault).not.toBeCalled();
  });
});
