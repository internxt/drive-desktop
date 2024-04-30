import { ContainerBuilder } from 'diod';
import { registerSharedServices } from './registerSharedServices';

export class SharedDependencyContainerFactory {
  static build(builder: ContainerBuilder): void {
    registerSharedServices(builder);
  }
}
