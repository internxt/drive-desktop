import { User } from '../../main/types';
import ConfigStore from '../../main/config';

function getUser(): User | null {
  const user = ConfigStore.get('userData');

  return user && Object.keys(user).length ? user : null;
}

export class DependencyInjectionUserProvider {
  private static _user: User;

  static get() {
    if (DependencyInjectionUserProvider._user)
      return DependencyInjectionUserProvider._user;

    const user = getUser();

    if (user) {
      DependencyInjectionUserProvider._user = user;
      return user;
    }

    throw new Error('Could not get user in dependency injection');
  }
}
