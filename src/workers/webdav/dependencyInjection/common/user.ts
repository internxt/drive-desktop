import { User } from '../../../../main/types';
import { getUser } from '../../../../main/auth/service';

export class DepenedencyInjectionUserProvider {
  private static _user: User;

  static get() {
    if (DepenedencyInjectionUserProvider._user)
      return DepenedencyInjectionUserProvider._user;

    const user = getUser();

    if (user) {
      DepenedencyInjectionUserProvider._user = user;
      return user;
    }

    throw new Error('Could not get user in dependency injection');
  }
}
