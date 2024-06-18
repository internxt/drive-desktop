import { ContainerBuilder } from 'diod';
import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';

export function registerTreeServices(builder: ContainerBuilder): void {
  builder.registerAndUse(RemoteTreeBuilder);
}
