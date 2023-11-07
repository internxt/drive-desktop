import { Storage } from '@internxt/sdk/dist/drive/storage';
import { ipcRenderer } from 'electron';
import { onUserUnauthorized } from '../../../../shared/HttpClient/backgroud-process-clients';

export class DependencyInjectionStorageSdk {
  private static sdk: Storage;

  static async get(): Promise<any> {
    if (DependencyInjectionStorageSdk.sdk) {
      return DependencyInjectionStorageSdk.sdk;
    }

    const url = `${process.env.API_URL}/api`;
    const { name: clientName, version: clientVersion } =
      await ipcRenderer.invoke('APP:INFO');

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
