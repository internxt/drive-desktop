import { logger } from '@internxt/drive-desktop-core/build/backend';
import { User } from '../../types';
import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import ConfigStore from '../../config';
import { updateCredentials } from '../service';

export async function initializeCurrentUser() {
  try {
    logger.debug({ tag: 'AUTH', msg: 'Initializing current user...' });

    const refreshResult = await driveServerModule.auth.refresh();
    if (refreshResult.isLeft()) {
      throw new Error(`Failed to refresh user data: ${refreshResult.getLeft().message}`);
    }

    const refreshData = refreshResult.getRight();
    updateCredentials(refreshData.token, refreshData.newToken);

    const currentUser = ConfigStore.get('userData') as User;
    const updatedUser: User = {
      ...currentUser,
      ...refreshData.user,
      mnemonic: currentUser.mnemonic,
    };

    ConfigStore.set('userData', updatedUser);

    logger.debug({ tag: 'AUTH', msg: 'Current user initialized successfully' });
  } catch (error) {
    throw logger.error({ tag: 'AUTH', msg: 'Failed to initialize current user', error });
  }
}
