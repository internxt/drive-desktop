import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { restoreSavedConfig, setUser, updateCredentials } from '../../auth/service';
import { emitUserLoggedIn, setIsLoggedIn } from '../../auth/handlers';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type Props = { search: string };

export async function processLogin({ search }: Props) {
  try {
    const params = new URLSearchParams(search);
    const base64Token = params.get('newToken');
    const base64PrivateKey = params.get('privateKey');
    const base64Mnemonic = params.get('mnemonic');

    if (!base64Token || !base64PrivateKey || !base64Mnemonic) return;

    const mnemonic = Buffer.from(base64Mnemonic, 'base64').toString('utf8');
    const newToken = Buffer.from(base64Token, 'base64').toString('utf8');
    const privateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf8');

    updateCredentials({ newToken });

    const { data, error } = await DriveServerWipModule.auth.refresh();

    if (error) throw error;

    /**
     * v2.6.3 Daniel Jiménez
     * We need to override the privateKey and the mnemonic since inside the user they are encrypted.
     * Previous to SSO we were using the password to encrypt and decrypt the privateKey and
     * mnemonic. However, since now the client never touches the password we need the backend
     * to send as the decrypted privateKey and mnemonic.
     */
    setUser({ ...data.user, privateKey, mnemonic } as any);

    restoreSavedConfig({ uuid: data.user.uuid });
    setIsLoggedIn(true);
    await emitUserLoggedIn();
  } catch (error) {
    logger.error({
      msg: 'Cannot process login deeplink',
      error,
    });
  }
}
