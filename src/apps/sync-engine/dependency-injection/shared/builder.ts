import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { getConfig } from '../../config';
import { SharedContainer } from './SharedContainer';

export function buildSharedContainer(): SharedContainer {
  const localRootFolderPath = getConfig().rootPath;
  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(localRootFolderPath);

  return {
    relativePathToAbsoluteConverter,
  };
}
