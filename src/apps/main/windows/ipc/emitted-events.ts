import { AuthService } from '@/context/infra/api/auth.service';

export type EmittedEvents = {
  'renderer.login-access': (props: Parameters<(typeof AuthService)['access']>[0]) => ReturnType<(typeof AuthService)['access']>;
  'renderer.login': (props: Parameters<(typeof AuthService)['login']>[0]) => ReturnType<(typeof AuthService)['login']>;
};
