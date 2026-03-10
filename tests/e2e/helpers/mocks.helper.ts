import { app } from 'electron';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

const mockGetPath = () => {
  app.setPath('home', process.env.PLAYWRIGHT_HOME_PATH!);
  app.setPath('appData', process.env.PLAYWRIGHT_DATA_PATH!);
};

const mockAuthRefresh = () => {
  DriveServerWipModule.auth.refresh = async () =>
    ({
      data: {
        newToken: 'mocked-refresh-token',
        user: {
          uuid: 'mocked-uuid',
          email: 'test@example.com',
          privateKey: 'mocked-privateKey',
          mnemonic: 'mocked-mnemonic',
        },
      },
      error: null,
    }) as any;
};

export const applyMocks = () => {
  mockGetPath();
  mockAuthRefresh();
};
