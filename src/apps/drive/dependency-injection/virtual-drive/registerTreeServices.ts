import { ContainerBuilder } from 'diod';
import { TreeBuilder } from '../../../../context/virtual-drive/tree/application/TreeBuilder';

export function registerTreeServices(builder: ContainerBuilder): void {
  builder.registerAndUse(TreeBuilder);
}
