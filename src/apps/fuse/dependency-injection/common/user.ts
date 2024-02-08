import { getUser } from '../../../main/auth/service';
import { User } from '../../../main/types';

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
