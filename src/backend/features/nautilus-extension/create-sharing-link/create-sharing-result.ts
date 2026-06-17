import { createSharing } from '../../../../infra/drive-server/services/sharings/services/create-sharing';
import { ShareableItem } from './types';

type Props = {
  encryptedCode: string;
  encryptionKey: string;
  item: ShareableItem;
};

export async function createSharingResult({ encryptedCode, encryptionKey, item }: Props) {
  const payload = {
    encryptedCode,
    encryptedPassword: null,
    encryptionAlgorithm: 'inxt-v2',
    encryptionKey,
    itemId: item.itemId,
    itemType: item.itemType,
    persistPreviousSharing: true,
  };

  const result = await createSharing({ body: payload });

  if (result.error) {
    throw new Error(`Error while creating sharing: ${result.error.message}`);
  }

  return result.data;
}
