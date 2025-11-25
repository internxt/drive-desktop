import { User } from '@/apps/main/types';

export type AuthContext = {
  user: User;
  abortController: AbortController;
};
