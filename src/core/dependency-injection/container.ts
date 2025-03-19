import { registerDI } from '@/apps/main/background-processes/sync-engine/di';
import { ContainerBuilder } from 'diod';

const builder = new ContainerBuilder();

registerDI(builder);

export const container = builder.build();
