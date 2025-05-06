import { IElectronAPI } from '../main/interface';

export const mockGetOrCreateDevice = jest.fn();
export const mockRenameDevice = jest.fn();
export const mockGetDevices = jest.fn();
export const mockOnDeviceCreated = jest.fn();
export const mockOpenUrl = jest.fn();
export const mockGetBackupsInterval = jest.fn();
export const mockSetBackupsInterval = jest.fn();
export const mockUserAvailableProductsGet = jest.fn();
export const mockUserAvailableProductsSubscribe = jest.fn();
export const mockUserAvailableProductsOnUpdate = jest.fn();

export const mockElectron: IElectronAPI = {
  getOrCreateDevice: mockGetOrCreateDevice,
  renameDevice: mockRenameDevice,
  devices: {
    getDevices: mockGetDevices,
  },
  onDeviceCreated: mockOnDeviceCreated,
  openUrl: mockOpenUrl,
  getBackupsInterval: mockGetBackupsInterval,
  setBackupsInterval: mockSetBackupsInterval,
  userAvailableProducts: {
    get: mockUserAvailableProductsGet,
    subscribe: mockUserAvailableProductsSubscribe,
    onUpdate: mockUserAvailableProductsOnUpdate,
  },
};
