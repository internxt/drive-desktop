import { OfflineDriveDependencyContainer } from './offline/OfflineDriveDependencyContainer';
import { UserDependencyContainer } from './user/UserDependencyContainer';
import { VirtualDriveDependencyContainer } from './virtual-drive/VirtualDriveDependencyContainer';

export interface FuseDependencyContainer {
  offlineDriveContainer: OfflineDriveDependencyContainer;
  virtualDriveContainer: VirtualDriveDependencyContainer;
  userContainer: UserDependencyContainer;
}
