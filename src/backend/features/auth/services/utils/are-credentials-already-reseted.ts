import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';
import { credentialFields } from '@/core/electron/store/credentials';

export function areCredentialsAlreadyReseted(): boolean {
  return credentialFields.every((field) => {
    const currentValue = ConfigStore.get(field);
    const defaultValue = defaults[field];

    if (typeof currentValue === 'object' && typeof defaultValue === 'object') {
      return JSON.stringify(currentValue) === JSON.stringify(defaultValue);
    }

    return currentValue === defaultValue;
  });
}
