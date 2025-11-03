import { configStore } from '@/apps/main/config';
import { defaults, fieldsToReset, fieldsToSave } from '@/core/electron/store/defaults';

export function resetConfig() {
  for (const field of [...fieldsToSave, ...fieldsToReset]) {
    configStore.set(field, defaults[field]);
  }
}
