import { getUser } from '@/apps/main/auth/service';
import ConfigStore from '@/apps/main/config';
import { fieldsToSave } from '@/core/electron/store/fields-to-save';

export function saveConfig() {
  const userUUID = getUser()?.uuid;
  if (!userUUID) {
    return;
  }

  const savedConfigs = ConfigStore.get('savedConfigs');

  const configToSave: Record<string, unknown> = {};

  for (const field of fieldsToSave) {
    const value = ConfigStore.get(field);
    configToSave[field] = value;
  }

  ConfigStore.set('savedConfigs', {
    ...savedConfigs,
    [userUUID]: configToSave,
  });
}
