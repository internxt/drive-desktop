import { User } from '@/apps/main/types';

export type LoginState = 'ready' | 'loading' | 'error' | 'warning';

export type AccessResponse = {
  newToken: string;
  token: string;
  user: User;
  password: string;
};
