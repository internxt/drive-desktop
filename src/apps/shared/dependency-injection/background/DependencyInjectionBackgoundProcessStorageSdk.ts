import { Storage } from '@internxt/sdk/dist/drive/storage';
import { ipcRenderer } from 'electron';
import packageJson from '../../../../../package.json';
import { onUserUnauthorized } from '../../HttpClient/background-process-clients';

export class DependencyInjectionBackgroundProcessStorageSdk {
  private static sdk: Storage;

  static async get(): Promise<any> {
    if (DependencyInjectionBackgroundProcessStorageSdk.sdk) {
      return DependencyInjectionBackgroundProcessStorageSdk.sdk;
    }

    const url = `${process.env.API_URL}`;
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

    DependencyInjectionBackgroundProcessStorageSdk.sdk = sdk;

    return DependencyInjectionBackgroundProcessStorageSdk.sdk;
  }
}
