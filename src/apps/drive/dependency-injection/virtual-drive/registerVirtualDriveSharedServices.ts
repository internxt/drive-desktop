import { ContainerBuilder } from 'diod';
import path from 'path';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';

export async function registerVirtualDriveSharedServices(
  builder: ContainerBuilder
): Promise<void> {
  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();

  const dir = await localFileContentsDirectoryProvider.provide();

  const base = path.join(dir, 'downloaded');

  builder
    .register(RelativePathToAbsoluteConverter)
    .useFactory(() => new RelativePathToAbsoluteConverter(base));
  builder
    .register(AbsolutePathToRelativeConverter)
    .useFactory(() => new AbsolutePathToRelativeConverter(base));
}
