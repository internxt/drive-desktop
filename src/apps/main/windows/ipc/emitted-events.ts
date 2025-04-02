import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export type EmittedEvents = {
  'renderer.login-access': (
    props: Parameters<(typeof driveServerWipModule)['auth']['access']>[0],
  ) => ReturnType<(typeof driveServerWipModule)['auth']['access']>;
  'renderer.login': (
    props: Parameters<(typeof driveServerWipModule)['auth']['login']>[0],
  ) => ReturnType<(typeof driveServerWipModule)['auth']['login']>;
};
