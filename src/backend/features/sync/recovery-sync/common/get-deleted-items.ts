import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { FileProps, FolderProps } from '../recovery-sync.types';
import { isItemDeleted } from './is-item-deleted';

type Props = FileProps | FolderProps;

export function getDeletedItems(props: FolderProps): SimpleDriveFolder[];
export function getDeletedItems(props: FileProps): SimpleDriveFile[];

export function getDeletedItems({ ctx, type, remotes, locals, checkpoint }: Props) {
  const checkpointDate = new Date(checkpoint.updatedAt);

  const remotesMap = new Map(remotes.map((item) => [item.uuid, item]));
  const deletedItems = locals.filter((local) => isItemDeleted({ ctx, type, local, remotesMap, checkpointDate }));

  return deletedItems;
}
