import { getConfig } from '@/apps/sync-engine/config';
import { logger } from '../logger/logger';

export class DependencyInjectionMnemonicProvider {
  private static _: string;

  static get() {
    if (DependencyInjectionMnemonicProvider._) {
      return DependencyInjectionMnemonicProvider._;
    }

    const mnemonic = getConfig().mnemonic;
    logger.info({
      msg: 'Mnemonic not found in dependency injection, using config',
      mnemonic,
    });
    if (mnemonic) {
      DependencyInjectionMnemonicProvider._ = mnemonic;
      return mnemonic;
    }

    throw new Error('Could not get mnemonic in dependency injection');
  }
}
