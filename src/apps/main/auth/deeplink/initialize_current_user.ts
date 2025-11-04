import { logger } from '@internxt/drive-desktop-core/build/backend';
import { updateCredentials } from '../service';
import { User } from '../../types';
import { driveServerModule } from '../../../../infra/drive-server/drive-server.module';
import ConfigStore from '../../config';

export async function initializeCurrentUser() {
  try {
    logger.debug({ msg: 'Initializing current user...' });
    const refreshResult = await driveServerModule.auth.refresh();
    if (refreshResult.isLeft()) {
      throw new Error(`Failed to refresh user data: ${refreshResult.getLeft().message}`);
    }

    const refreshData = refreshResult.getRight();

    logger.debug({ msg: 'User data refreshed successfully', userId: refreshData.user?.userId });
    updateCredentials(refreshData.token, refreshData.newToken);

    const currentUser = ConfigStore.get('userData') as User;

    const updatedUser: User = {
      ...currentUser,
      ...refreshData.user,
      mnemonic: currentUser.mnemonic,
    };

    ConfigStore.set('userData', updatedUser);

    logger.debug({ msg: 'Current user initialized successfully', userEmail: updatedUser.email });
  } catch (error) {
    throw logger.error({ msg: 'Failed to initialize current user', error });
  }
}
