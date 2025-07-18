import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';
import { credentialFields } from '@/core/electron/store/credentials';

export function resetCredentials() {
  for (const field of credentialFields) {
    ConfigStore.set(field, defaults[field]);
  }
}
