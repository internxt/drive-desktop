import { electronStore } from '@/apps/main/config';
import { defaults, fieldsToReset, fieldsToSave } from '@/core/electron/store/defaults';

export function resetConfig() {
  for (const field of [...fieldsToSave, ...fieldsToReset]) {
    electronStore.set(field, defaults[field]);
  }
}
