import configStore from '../../../../main/config';

export class DepenedencyInjectionMnemonicProvider {
  private static _: string;

  static get() {
    if (DepenedencyInjectionMnemonicProvider._) {
      return DepenedencyInjectionMnemonicProvider._;
    }

    const mnemonic = configStore.get('mnemonic');

    if (mnemonic) {
      DepenedencyInjectionMnemonicProvider._ = mnemonic;
      return mnemonic;
    }

    throw new Error('Could not get mnemonic in dependency injection');
  }
}
