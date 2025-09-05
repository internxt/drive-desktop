import { AppStore } from './app-store.interface';

export const credentialFields: (keyof AppStore)[] = ['mnemonic', 'userData', 'newToken'] as const;
