import ConfigStore from '../config';
import { User } from '../types';

export function getUser(): User | null {
  const user = ConfigStore.get('userData');

  return user && Object.keys(user).length ? user : null;
}
