import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PollingMonitorStart } from '../../../../context/virtual-drive/shared/application/PollingMonitorStart';
import { PollingMonitorStop } from '../../../../context/virtual-drive/shared/application/PollingMonitorStop';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';

export interface SharedContainer {
  absolutePathToRelativeConverter: AbsolutePathToRelativeConverter;
  relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter;
  pollingMonitorStart: PollingMonitorStart;
  pollingMonitorStop: PollingMonitorStop;
}
