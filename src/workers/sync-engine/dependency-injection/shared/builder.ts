import { AbsolutePathToRelativeConverter } from '../../modules/shared/application/AbsolutePathToRelativeConverter';
import { SharedContainer } from './SharedContainer';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { RelativePathToAbsoluteConverter } from '../../modules/shared/application/RelativePathToAbsoluteConverter';
import { LocalFileIdProvider } from '../../modules/shared/application/LocalFileIdProvider';

export function buildSharedContainer(): SharedContainer {
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();
  const absolutePathToRelativeConverter = new AbsolutePathToRelativeConverter(
    localRootFolderPath
  );

  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(
    localRootFolderPath
  );

  const localFileIdProvider = new LocalFileIdProvider(
    relativePathToAbsoluteConverter
  );

  return {
    absolutePathToRelativeConverter,
    relativePathToAbsoluteConverter,
    localFileIdProvider,
  };
}
