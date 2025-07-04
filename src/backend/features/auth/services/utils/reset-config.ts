import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';
import { fieldsToSave } from '@/core/electron/store/fields-to-save';

export function resetConfig() {
  for (const field of fieldsToSave) {
    ConfigStore.set(field, defaults[field]);
  }
}
