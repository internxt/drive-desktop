import { SharedContainer } from './SharedContainer';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { AbsolutePathToRelativeConverter } from 'context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { RelativePathToAbsoluteConverter } from 'context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';

export function buildSharedContainer(): SharedContainer {
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();
  const absolutePathToRelativeConverter = new AbsolutePathToRelativeConverter(
    localRootFolderPath
  );

  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(
    localRootFolderPath
  );

  return {
    absolutePathToRelativeConverter,
    relativePathToAbsoluteConverter,
  };
}
