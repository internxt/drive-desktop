import { dialog } from 'electron';
import configStore, { type AppStore } from '../config';
import eventBus from '../event-bus';
import * as validateRootFolderChangeModule from './validate-root-folder-change';
import { chooseSyncRootWithDialog, getRootVirtualDrive } from './service';

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
  },
  shell: {
    openPath: vi.fn(),
  },
}));

vi.mock('../../../core/electron/paths', () => ({
  PATHS: {
    ROOT_DRIVE_FOLDER: '/home/user/Internxt Drive',
    VIRTUAL_DRIVE_FOLDER_NAME: 'Internxt Drive',
  },
}));

vi.mock('../config', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../event-bus', () => ({
  default: {
    emit: vi.fn(),
  },
}));

vi.mock('../../shared/fs/ensure-folder-exists', () => ({
  ensureFolderExists: vi.fn(),
}));

vi.mock('./validate-root-folder-change', () => ({
  validateRootFolderChange: vi.fn(),
  isPermissionError: vi.fn(),
}));

describe('service', () => {
  const configGetMock = vi.mocked(configStore.get);
  const configSetMock = vi.mocked(configStore.set);
  const eventBusEmitMock = vi.mocked(eventBus.emit);
  const validateRootFolderChangeMock = vi.mocked(validateRootFolderChangeModule.validateRootFolderChange);
  const isPermissionErrorMock = vi.mocked(validateRootFolderChangeModule.isPermissionError);

  beforeEach(() => {
    const state = new Map<keyof AppStore, AppStore[keyof AppStore]>([
      ['virtualDriveRoot', ''],
      ['lastSavedListing', ''],
    ]);

    configGetMock.mockImplementation((key) => state.get(key) as AppStore[typeof key]);
    configSetMock.mockImplementation((key, value) => {
      state.set(key, value);
    });

    validateRootFolderChangeMock.mockResolvedValue(null);
    isPermissionErrorMock.mockReturnValue(false);
  });

  it('should fallback to default root folder when no saved path exists', () => {
    const state = new Map<keyof AppStore, AppStore[keyof AppStore]>([
      ['virtualDriveRoot', ''],
      ['lastSavedListing', ''],
    ]);

    configGetMock.mockImplementation((key) => {
      return state.get(key) as AppStore[typeof key];
    });
    configSetMock.mockImplementation((key, value) => {
      state.set(key, value);
    });

    const rootPath = getRootVirtualDrive();

    expect(rootPath).toBe('/home/user/Internxt Drive/');
    expect(configSetMock).toHaveBeenCalledWith('virtualDriveRoot', '/home/user/');
  });

  it('should emit SYNC_ROOT_CHANGED with old and new paths when user picks a different folder', async () => {
    const state = new Map<keyof AppStore, AppStore[keyof AppStore]>([
      ['virtualDriveRoot', '/old/root/'],
      ['lastSavedListing', ''],
    ]);

    configGetMock.mockImplementation((key) => state.get(key) as AppStore[typeof key]);
    configSetMock.mockImplementation((key, value) => {
      state.set(key, value);
    });

    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/new/root'],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'success', path: '/new/root/Internxt Drive/' });
    expect(eventBusEmitMock).toHaveBeenCalledWith('SYNC_ROOT_CHANGED', {
      oldPath: '/old/root/Internxt Drive/',
      newPath: '/new/root/Internxt Drive/',
    });
  });

  it('should return cancelled result when user dismisses folder picker', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: true,
      filePaths: [],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'cancelled' });
    expect(validateRootFolderChangeMock).not.toHaveBeenCalled();
    expect(eventBusEmitMock).not.toHaveBeenCalled();
  });

  it('should return validation error from validateRootFolderChange', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/media/user/usb'],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);
    validateRootFolderChangeMock.mockResolvedValueOnce({
      status: 'error',
      code: 'REMOVABLE_DEVICE',
    });

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'error', code: 'REMOVABLE_DEVICE' });
    expect(eventBusEmitMock).not.toHaveBeenCalled();
  });

  it('should not emit SYNC_ROOT_CHANGED when resulting mount path does not change', async () => {
    const state = new Map<keyof AppStore, AppStore[keyof AppStore]>([
      ['virtualDriveRoot', '/old/root/'],
      ['lastSavedListing', ''],
    ]);

    configGetMock.mockImplementation((key) => state.get(key) as AppStore[typeof key]);
    configSetMock.mockImplementation((key, value) => {
      state.set(key, value);
    });

    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/old/root'],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'success', path: '/old/root/Internxt Drive/' });
    expect(eventBusEmitMock).not.toHaveBeenCalled();
  });

  it('should return INSUFFICIENT_PERMISSION when an error is caught and identified as permission error', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/restricted/path'],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);

    validateRootFolderChangeMock.mockRejectedValueOnce(new Error('permission denied'));
    isPermissionErrorMock.mockReturnValueOnce(true);

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'error', code: 'INSUFFICIENT_PERMISSION' });
    expect(eventBusEmitMock).not.toHaveBeenCalled();
  });

  it('should return UNKNOWN when an unknown error is caught', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/problematic/path'],
    } as Awaited<ReturnType<typeof dialog.showOpenDialog>>);

    validateRootFolderChangeMock.mockRejectedValueOnce(new Error('unexpected failure'));
    isPermissionErrorMock.mockReturnValueOnce(false);

    const selectedPath = await chooseSyncRootWithDialog();

    expect(selectedPath).toStrictEqual({ status: 'error', code: 'UNKNOWN' });
    expect(eventBusEmitMock).not.toHaveBeenCalled();
  });
});
