import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';

export interface SharedContainer {
  absolutePathToRelativeConverter: AbsolutePathToRelativeConverter;
  relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter;
}
