import { updateCredentials } from './service';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export async function refreshToken() {
  const { data } = await driveServerWipModule.auth.refresh();

  if (data) {
    updateCredentials({ newToken: data.newToken });
    return true;
  } else {
    return false;
  }
}
