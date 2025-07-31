import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';
import { Device } from './device/service';
import {
  AuthAccessResponseViewModel,
  AuthLoginResponseViewModel,
  LoginAccessRequest
} from '../../infra/drive-server/services/auth/auth.types';
/** This interface and declare global will replace the preload.d.ts.
* The thing is that instead of that, we will gradually will be declaring the interface here as we generate tests
* And we need to mock the electron API.
* Once we have all the interface declared here, we can replace the preload.d.ts with this file.
**/

export interface IElectronAPI {
  getBackupsInterval(): Promise<number>;

  setBackupsInterval(value: number): Promise<void>;

  getOrCreateDevice: () => Promise<Device | Error>;
  renameDevice: (deviceName: string) => Promise<Device>;
  devices: {

    getDevices: () => Promise<Array<Device>>;
  };

  onDeviceCreated: (callback: (device: Device) => void) => () => void;

  openUrl: (url: string) => Promise<void>;

  userAvailableProducts: {

    get: () => Promise<AvailableProducts['featuresPerService'] | undefined>;
    subscribe: () => void;
    onUpdate: (
      callback: (products: AvailableProducts['featuresPerService']) => void
    ) => void;
  };
  login(email: string): Promise<AuthLoginResponseViewModel>;
  access(credentials: LoginAccessRequest): Promise<AuthAccessResponseViewModel>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
