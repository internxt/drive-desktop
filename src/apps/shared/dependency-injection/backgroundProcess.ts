import { ContainerBuilder } from 'diod';
import { AuthorizedClients } from '../HttpClient/Clients';
import { BackgroundProcessAuthorizedClients } from '../../../context/shared/infrastructure/BackgroundProcess/BackgroundProcessAuthorizedClients';
import { onUserUnauthorized } from '../HttpClient/background-process-clients';
import packageJson from '../../../../package.json';
import { Storage } from '@internxt/sdk/dist/drive/storage';
import { ipcRenderer } from 'electron';

export async function backgroundProcess(
  builder: ContainerBuilder
): Promise<ContainerBuilder> {
  const token = await ipcRenderer.invoke('get-token');

  builder
    .register(AuthorizedClients)
    .useClass(BackgroundProcessAuthorizedClients)
    .asSingleton()
    .private();

  builder
    .register(Storage)
    .useFactory(() => {
      const { name: clientName, version: clientVersion } = packageJson;
      const sdk = Storage.client(
        `${process.env.API_URL}/api`,
        {
          clientName,
          clientVersion,
        },
        {
          token,
          unauthorizedCallback: onUserUnauthorized,
        }
      );

      return sdk;
    })
    .asSingleton()
    .private();

  return builder;
}
