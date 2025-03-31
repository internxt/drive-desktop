import { getUser } from './service';

export class GetUserService {
  getOrThrow() {
    const user = getUser();
    if (!user) throw new Error('User not found');
    return user;
  }
}
