import { ContainerBuilder } from 'diod';
import { OfflineFileAndContentsCreator } from '../../../../context/offline-drive/boundaryBridge/application/OfflineFileAndContentsCreator';

export async function registerBoundaryBridgeContainer(
  builder: ContainerBuilder
): Promise<void> {
  builder.registerAndUse(OfflineFileAndContentsCreator);
}
