import { Environment } from '@internxt/inxt-js';
import { ContainerBuilder } from 'diod';
import os from 'os';
import path from 'path';
import { ThumbnailSynchronizer } from '../../../../context/storage/thumbnails/application/sync/ThumbnailSynchronizer';
import { LocalThumbnailRepository } from '../../../../context/storage/thumbnails/infrastructrue/local/LocalThumbnsailsRepository';
import { SystemThumbnailNameCalculator } from '../../../../context/storage/thumbnails/infrastructrue/local/SystemThumbnailNameCalculator';
import { EnvironmentThumbnailDownloader } from '../../../../context/storage/thumbnails/infrastructrue/remote/EnvironmentThumbnailDownloader';
import { RemoteThumbnailsRepository } from '../../../../context/storage/thumbnails/infrastructrue/remote/RemoteThumbnailsRepository';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';

export async function registerThumbnailsServices(builder: ContainerBuilder) {
  const user = DependencyInjectionMainProcessUserProvider.get();

  builder.register(EnvironmentThumbnailDownloader).useFactory((c) => {
    return new EnvironmentThumbnailDownloader(
      c.get(Environment).download,
      user.bucket
    );
  });

  builder.registerAndUse(SystemThumbnailNameCalculator);

  builder.register(ThumbnailSynchronizer).useFactory((c) => {
    const clients = c.get(AuthorizedClients);

    const remote = new RemoteThumbnailsRepository(
      //@ts-ignore
      clients.newDrive,
      c.get(EnvironmentThumbnailDownloader)
    );

    const pathConverter = c.get(RelativePathToAbsoluteConverter);

    const local = new LocalThumbnailRepository(
      pathConverter,
      c.get(SystemThumbnailNameCalculator),
      path.join(os.homedir(), '.cache', 'thumbnails')
    );

    return new ThumbnailSynchronizer(remote, local);
  });

  // const appData = app.getPath('appData');
  // const local = path.join(appData, 'internxt-drive', 'thumbnails');

  // const systemDefaultIconsGenerator = new SystemDefaultIconsGenerator(local);
  // await systemDefaultIconsGenerator.init();

  // builder
  //   .register(SystemDefaultIconsGenerator)
  //   .useInstance(systemDefaultIconsGenerator);
}
