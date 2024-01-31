import { OfflineDriveDependencyContainer } from './offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from './virtual-drive/VirtualDriveDependencyContainer';

export interface FuseDependencyContainer {
  offlineDriveContainer: OfflineDriveDependencyContainer;
  virtualDriveContainer: VirtualDriveDependencyContainer;
}
