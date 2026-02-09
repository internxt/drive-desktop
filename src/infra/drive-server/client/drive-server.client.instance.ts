import { paths } from '../../schemas';
import { logout } from '../../../apps/main/auth/service';
import eventBus from '../../../apps/main/event-bus';
import { ClientOptions, createClient } from '../drive-server.client';

function handleOnUserUnauthorized(): void {
  eventBus.emit('USER_WAS_UNAUTHORIZED');
  logout();
}

const clientOptions: ClientOptions = {
  baseUrl: process.env.NEW_DRIVE_URL || '',
  onUnauthorized: handleOnUserUnauthorized,
};

export const driveServerClient = createClient<paths>(clientOptions);
