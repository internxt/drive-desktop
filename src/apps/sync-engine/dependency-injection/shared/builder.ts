import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PollingMonitorStart } from '../../../../context/virtual-drive/shared/application/PollingMonitorStart';
import { PollingMonitorStop } from '../../../../context/virtual-drive/shared/application/PollingMonitorStop';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { PollingMonitor } from '../../../../context/virtual-drive/shared/domain/PollingMonitor';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { SharedContainer } from './SharedContainer';

export function buildSharedContainer(): SharedContainer {
  const MONITORING_PULLING_INTERVAL = 60 * 60 * 1000;
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();
  const absolutePathToRelativeConverter = new AbsolutePathToRelativeConverter(localRootFolderPath);

  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(localRootFolderPath);

  const pollingMonitor = new PollingMonitor(MONITORING_PULLING_INTERVAL);
  const pollingMonitorStart = new PollingMonitorStart(pollingMonitor);
  const pollingMonitorStop = new PollingMonitorStop(pollingMonitor);

  return {
    absolutePathToRelativeConverter,
    relativePathToAbsoluteConverter,
    pollingMonitorStart,
    pollingMonitorStop,
  };
}
