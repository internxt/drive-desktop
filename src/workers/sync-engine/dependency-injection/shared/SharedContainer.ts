import { AbsolutePathToRelativeConverter } from '../../modules/shared/application/AbsolutePathToRelativeConverter';
import { RelativePathToAbsoluteConverter } from '../../modules/shared/application/RelativePathToAbsoluteConverter';

export interface SharedContainer {
  absolutePathToRelativeConverter: AbsolutePathToRelativeConverter;
  relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter;
}
