import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

export type LoginState = 'ready' | 'loading' | 'error' | 'warning';

export type AccessResponse = Awaited<ReturnType<typeof driveServerWip.auth.access>> & {
  password: string;
};
