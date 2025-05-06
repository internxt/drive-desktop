import { driveServerModule } from '../drive-server/drive-server.module';
import { LoginAccessRequest } from '../drive-server/services/auth/auth.types';
export type EmittedEvents = {
  'auth:login': (
    props: Parameters<(typeof driveServerModule)['auth']['login']>[0]
  ) => ReturnType<(typeof driveServerModule)['auth']['login']>;

  'auth:access': (
    props: LoginAccessRequest
  ) => ReturnType<(typeof driveServerModule)['auth']['access']>;
};
