import configStore from '../../../main/config';

export class DependencyInjectionMnemonicProvider {
  private static _: string;

  static get() {
    if (DependencyInjectionMnemonicProvider._) {
      return DependencyInjectionMnemonicProvider._;
    }

    const mnemonic = configStore.get('mnemonic');

    if (mnemonic) {
      DependencyInjectionMnemonicProvider._ = mnemonic;
      return mnemonic;
    }

    throw new Error('Could not get mnemonic in dependency injection');
  }
}
