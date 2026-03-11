import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { restoreSavedConfig, setUser, updateCredentials } from '../../auth/service';
import { emitUserLoggedIn } from '../../auth/handlers';
import { validateMnemonic } from 'bip39';
import { User } from '../../types';
import electronStore from '../../config';

type Props = { search: string };

export async function processLogin({ search }: Props) {
  const params = new URLSearchParams(search);
  const base64Token = params.get('newToken');
  const base64PrivateKey = params.get('privateKey');
  const base64Mnemonic = params.get('mnemonic');

  if (!base64Token || !base64PrivateKey || !base64Mnemonic) return;

  const mnemonic = Buffer.from(base64Mnemonic, 'base64').toString('utf8');
  const newToken = Buffer.from(base64Token, 'base64').toString('utf8');
  const privateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf8');

  const isValid = validateMnemonic(mnemonic);

  if (!isValid) throw new Error(`Invalid mnemonic: ${mnemonic.slice(0, 20)}`);

  updateCredentials({ newToken });

  const { data, error } = await DriveServerWipModule.auth.refresh();

  if (error) throw error;

  updateCredentials({ newToken: data.newToken });

  /**
   * v2.6.3 Daniel Jiménez
   * We need to override the privateKey and the mnemonic since inside the user they are encrypted.
   * Previous to SSO we were using the password to encrypt and decrypt the privateKey and
   * mnemonic. However, since now the client never touches the password we need the frontend
   * to send as the decrypted privateKey and mnemonic.
   */
  const user: User = { ...data.user, privateKey, mnemonic };
  electronStore.set('userData', user);

  restoreSavedConfig({ uuid: data.user.uuid });
  void emitUserLoggedIn(user);
}
