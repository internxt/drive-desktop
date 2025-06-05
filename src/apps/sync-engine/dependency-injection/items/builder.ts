import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { getConfig } from '../../config';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const user = getUserOrThrow();

  const traverser = new Traverser(user.root_folder_id, getConfig().rootUuid);

  return { traverser };
}
