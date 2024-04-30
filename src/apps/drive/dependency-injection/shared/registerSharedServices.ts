import { ContainerBuilder } from 'diod';
import { TriggerRemoteSyncOnFileOverridden } from '../../../../context/shared/application/sync/TriggerRemoteSyncOnFileOverridden';

export async function registerSharedServices(builder: ContainerBuilder) {
  // Event handlers
  builder
    .registerAndUse(TriggerRemoteSyncOnFileOverridden)
    .addTag('event-handler');
}
