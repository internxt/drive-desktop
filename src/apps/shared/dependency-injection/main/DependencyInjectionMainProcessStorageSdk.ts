import { Storage } from '@internxt/sdk/dist/drive/storage';
import { onUserUnauthorized } from '../../HttpClient/background-process-clients';
import packageJson from '../../../../../package.json';
import { obtainToken } from '../../../main/auth/service';

export class DependencyInjectionMainProcessStorageSdk {
  private static sdk: Storage;

  static async get(): Promise<any> {
    if (DependencyInjectionMainProcessStorageSdk.sdk) {
      return DependencyInjectionMainProcessStorageSdk.sdk;
    }

    const url = `${process.env.API_URL}/api`;
    const { name: clientName, version: clientVersion } = packageJson;

    const token = obtainToken('bearerToken');

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

    DependencyInjectionMainProcessStorageSdk.sdk = sdk;

    return DependencyInjectionMainProcessStorageSdk.sdk;
  }
}
