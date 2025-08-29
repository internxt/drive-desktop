import VirtualDrive from '@/node-win/virtual-drive';
import { ContentsContainer } from './contents/ContentsContainer';
import { FilesContainer } from './files/FilesContainer';
import { BoundaryBridgeContainer } from './boundaryBridge/BoundaryBridgeContainer';
import { SharedContainer } from './shared/SharedContainer';

export interface DependencyContainer extends ContentsContainer, FilesContainer, SharedContainer, BoundaryBridgeContainer {
  virtualDrive: VirtualDrive;
}
