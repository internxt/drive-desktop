import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { SharedContainer } from './SharedContainer';

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
