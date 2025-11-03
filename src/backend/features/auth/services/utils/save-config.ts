import { getUser } from '@/apps/main/auth/service';
import { configStore } from '@/apps/main/config';
import { fieldsToSave } from '@/core/electron/store/defaults';

export function saveConfig() {
  const userUUID = getUser()?.uuid;

  if (!userUUID) {
    return;
  }

  const savedConfigs = configStore.get('savedConfigs');

  const configToSave: Record<string, unknown> = {};

  for (const field of fieldsToSave) {
    configToSave[field] = configStore.get(field);
  }

  configStore.set('savedConfigs', {
    ...savedConfigs,
    [userUUID]: configToSave,
  });
}
