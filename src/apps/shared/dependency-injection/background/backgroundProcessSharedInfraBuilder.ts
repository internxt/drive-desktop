import { ContainerBuilder } from 'diod';
import { AuthorizedClients } from '../../HttpClient/Clients';
import { BackgroundProcessAuthorizedClients } from '../../../../context/shared/infrastructure/BackgroundProcess/BackgroundProcessAuthorizedClients';

export async function backgroundProcessSharedInfraBuilder(): Promise<ContainerBuilder> {
  const builder = new ContainerBuilder();

  builder
    .register(AuthorizedClients)
    .useClass(BackgroundProcessAuthorizedClients)
    .asSingleton()
    .private();

  return builder;
}
