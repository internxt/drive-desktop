import configStore from '../../../main/config';

export class DependencyInjectionMainProcessMnemonicProvider {
  private static _: string;

  static get() {
    if (DependencyInjectionMainProcessMnemonicProvider._) {
      return DependencyInjectionMainProcessMnemonicProvider._;
    }

    const mnemonic = configStore.get('mnemonic');

    if (mnemonic) {
      DependencyInjectionMainProcessMnemonicProvider._ = mnemonic;
      return mnemonic;
    }

    throw new Error('Could not get mnemonic in dependency injection');
  }
}
