import { Environment } from '@internxt/inxt-js';
import { DependencyInjectionUserProvider } from './user';
import { DependencyInjectionMnemonicProvider } from './mnemonic';

export class DependencyInjectionInxtEnvironment {
  private static environment: Environment;

  static get(): Environment {
    if (DependencyInjectionInxtEnvironment.environment) {
      return DependencyInjectionInxtEnvironment.environment;
    }

    const user = DependencyInjectionUserProvider.get();
    const mnemonic = DependencyInjectionMnemonicProvider.get();

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: mnemonic,
    });

    DependencyInjectionInxtEnvironment.environment = environment;

    return DependencyInjectionInxtEnvironment.environment;
  }
}
