import { registerDI } from '@/apps/main/background-processes/sync-engine/di';
import { ContainerBuilder } from 'diod';

export function getDIContainer() {
  const builder = new ContainerBuilder();

  registerDI(builder);

  return builder.build();
}
