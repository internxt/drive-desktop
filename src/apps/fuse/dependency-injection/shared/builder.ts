import path from 'path';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { SharedContainer } from './SharedContainer';

export async function buildSharedContainer(): Promise<SharedContainer> {
  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();

  const dir = await localFileContentsDirectoryProvider.provide();

  const base = path.join(dir, 'downloaded');

  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(
    base
  );

  return {
    relativePathToAbsoluteConverter,
  };
}
