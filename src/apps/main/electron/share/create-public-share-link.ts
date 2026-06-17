import { createShareClient } from '@internxt/drive-desktop-core/build/backend/features/share-link';
import { aes, stringUtils } from '@internxt/lib';
import { Share } from '@internxt/sdk/dist/drive/share';
import { obtainToken } from '@/apps/main/auth/service';
import { SyncContext } from '@/apps/sync-engine/config';
import packageJson from '../../../../../package.json';
import { ContextMenuItem } from './types';

const ENCRYPTION_ALGORITHM = 'inxt-v2';
const SHARE_CODE_LENGTH = 8;
type Props = {
  item: ContextMenuItem;
  ctx: SyncContext;
};
export async function createPublicShareLink({ item, ctx }: Props) {
  try {
    const shareClient = createShareClient({
      apiUrl: process.env.DRIVE_URL,
      clientName: packageJson.name,
      clientVersion: packageJson.version,
      desktopHeader: process.env.DESKTOP_HEADER,
      token: obtainToken(),
      workspaceToken: ctx.workspaceToken || undefined,
    });

    const { data: domain, error } = await getDomain(shareClient);
    if (error) {
      return { error };
    }
    const code = stringUtils.generateRandomStringUrlSafe(SHARE_CODE_LENGTH);
    const sharing = await shareClient.createSharing({
      itemId: item.uuid,
      itemType: item.type,
      encryptionKey: aes.encrypt(ctx.mnemonic, code),
      encryptionAlgorithm: ENCRYPTION_ALGORITHM,
      encryptedCode: aes.encrypt(code, ctx.mnemonic),
      persistPreviousSharing: true,
    });

    const plainCode = aes.decrypt(sharing.encryptedCode, ctx.mnemonic);
    const encodedSharingId = stringUtils.encodeV4Uuid(sharing.id);

    return { data: `${domain}/sh/${item.type}/${encodedSharingId}/${plainCode}` };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to create public share link', { cause: error }),
    };
  }
}

async function getDomain(shareClient: Pick<Share, 'getShareDomains'>) {
  const { list: domains } = await shareClient.getShareDomains();
  if (!domains || domains.length === 0) {
    const error = new Error('No share domains available');
    return { error };
  }
  return { data: domains[0] };
}
