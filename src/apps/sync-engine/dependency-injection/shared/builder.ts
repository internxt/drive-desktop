import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { ProcessSyncContext } from '../../config';
import { SharedContainer } from './SharedContainer';

export function buildSharedContainer({ ctx }: { ctx: ProcessSyncContext }): SharedContainer {
  const localRootFolderPath = ctx.rootPath;
  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(localRootFolderPath);

  return {
    relativePathToAbsoluteConverter,
  };
}
