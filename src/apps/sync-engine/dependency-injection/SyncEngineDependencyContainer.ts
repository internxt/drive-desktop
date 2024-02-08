// @ts-ignore
import { VirtualDrive } from 'virtual-drive/dist';
import { ContentsContainer } from './contents/ContentsContainer';
import { FilesContainer } from './files/FilesContainer';
import { FoldersContainer } from './folders/FoldersContainer';
import { ItemsContainer } from './items/ItemsContainer';
import { BoundaryBridgeContainer } from './boundaryBridge/BoundaryBridgeContainer';
import { SharedContainer } from './shared/SharedContainer';

export interface SyncEngineDependencyContainer
  extends ItemsContainer,
    ContentsContainer,
    FilesContainer,
    FoldersContainer,
    SharedContainer,
    BoundaryBridgeContainer {
  virtualDrive: VirtualDrive;
}
