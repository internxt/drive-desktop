import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { getConfig } from '../../config';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const traverser = new Traverser(getConfig().rootPath as AbsolutePath, getConfig().rootUuid);

  return { traverser };
}
