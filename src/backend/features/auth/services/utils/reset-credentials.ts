import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';

export function resetCredentials() {
  for (const field of ['mnemonic', 'userData', 'bearerToken', 'bearerTokenEncrypted', 'newToken'] as const) {
    ConfigStore.set(field, defaults[field]);
  }
}
