import { aes, stringUtils } from '@internxt/lib';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { validateMnemonic } from 'bip39';
import { Notification, clipboard } from 'electron';
import { getCredentials } from '../../../../apps/main/auth/get-credentials';
import { createSharingResult } from './create-sharing-result';
import { fetchRandomDomain } from './fetch-random-domain';
import { resolveShareableItem } from './resolve-shareable-item';
import { Result } from '../../../../context/shared/domain/Result';

export type Props = { path: string };

export async function generateLink({ path }: Props): Promise<Result<string, Error>> {
  const { mnemonic } = getCredentials();

  if (!validateMnemonic(mnemonic)) {
    return { error: new Error('The user mnemonic is invalid') };
  }

  try {
    const item = await resolveShareableItem({ path });
    const domain = await fetchRandomDomain();
    const plainCode = stringUtils.generateRandomStringUrlSafe(8);
    const encryptionKey = aes.encrypt(mnemonic, plainCode);
    const encryptedCode = aes.encrypt(plainCode, mnemonic);
    const sharing = await createSharingResult({
      encryptedCode,
      encryptionKey,
      item,
    });
    const recoveredCode = aes.decrypt(sharing.encryptedCode, mnemonic);
    const sharingId = stringUtils.encodeV4Uuid(sharing.id);
    const shareLink = `${domain}/sh/${item.itemType}/${sharingId}/${recoveredCode}`;

    clipboard.writeText(shareLink);

    new Notification({
      title: 'Sharing Link Copied',
      body: 'The sharing link has been copied successfully',
    }).show();

    logger.debug({
      msg: 'link copied',
      itemType: item.itemType,
      path,
    });

    return { data: shareLink };
  } catch (error) {
    new Notification({
      title: 'Sharing Link Not Copied',
      body: 'Could not generate the sharing link. Please try again.',
    }).show();

    return { error: new Error('Error generating sharing link') };
  }
}
