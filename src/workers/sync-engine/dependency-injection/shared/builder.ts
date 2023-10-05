import { AbsolutePathToRelativeConverter } from 'workers/sync-engine/modules/shared/application/AbsolutePathToRelativeConverter';
import { SharedContainer } from './SharedContainer';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { RelativePathToAbsoluteConverter } from 'workers/sync-engine/modules/shared/application/RelativePathToAbsoluteConverter';

export function buildSharedContainer(): SharedContainer {
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();
  const absolutePathToRelativeConverter = new AbsolutePathToRelativeConverter(
    localRootFolderPath
  );

  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(
    localRootFolderPath
  );

  return { absolutePathToRelativeConverter, relativePathToAbsoluteConverter };
}
