import { Storage } from '@internxt/sdk/dist/drive/storage';
import { ipcRenderer } from 'electron';
import { onUserUnauthorized } from '../../../shared/HttpClient/background-process-clients';
import packageJson from '../../../../../package.json';

export class DependencyInjectionStorageSdk {
  private static sdk: Storage;

  static async get(): Promise<any> {
    if (DependencyInjectionStorageSdk.sdk) {
      return DependencyInjectionStorageSdk.sdk;
    }

    const url = `${process.env.API_URL}/api`;
    const { name: clientName, version: clientVersion } = packageJson;

    const token = await ipcRenderer.invoke('get-token');

    const sdk = Storage.client(
      url,
      {
        clientName,
        clientVersion,
      },
      {
        token,
        unauthorizedCallback: onUserUnauthorized,
      }
    );

    DependencyInjectionStorageSdk.sdk = sdk;

    return DependencyInjectionStorageSdk.sdk;
  }
}
