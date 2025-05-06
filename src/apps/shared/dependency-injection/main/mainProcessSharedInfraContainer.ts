import { ContainerBuilder } from 'diod';
import { MainProcessAuthorizedClients } from '../../../../context/shared/infrastructure/MainProcess/MainProcessAuthorizedClients';
import { AuthorizedClients } from '../../HttpClient/Clients';
import { MainProcessDownloadProgressTracker } from '../../../../context/shared/infrastructure/MainProcess/MainProcessDownloadProgressTracker';
import { DownloadProgressTracker } from '../../../../context/shared/domain/DownloadProgressTracker';
import { baseInfra } from '../baseInfra';
import { UploadProgressTracker } from '../../../../context/shared/domain/UploadProgressTracker';
import { MainProcessUploadProgressTracker } from '../../../../context/shared/infrastructure/MainProcess/MainProcessUploadProgressTracker';
import { RemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/domain/RemoteItemsGenerator';
import { SQLiteRemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/infrastructure/SQLiteRemoteItemsGenerator';

export async function mainProcessSharedInfraBuilder(): Promise<ContainerBuilder> {
  const builder = baseInfra();

  builder
    .register(AuthorizedClients)
    .useClass(MainProcessAuthorizedClients)
    .asSingleton()
    .private()
    .addTag('shared');

  builder
    .register(DownloadProgressTracker)
    .use(MainProcessDownloadProgressTracker)
    .private()
    .addTag('shared');

  builder
    .register(UploadProgressTracker)
    .use(MainProcessUploadProgressTracker)
    .private();

  builder
    .register(RemoteItemsGenerator)
    .use(SQLiteRemoteItemsGenerator)
    .private();

  return builder;
}
