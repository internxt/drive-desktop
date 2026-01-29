import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { FileProps, FolderProps } from '../recovery-sync.types';
import { isItemToSync } from './is-item-to-sync';

type Props = FileProps | FolderProps;

export function getItemsToSync(props: FolderProps): ParsedFolderDto[];
export function getItemsToSync(props: FileProps): ParsedFileDto[];

export function getItemsToSync({ ctx, type, remotes, locals, checkpoint }: Props) {
  const checkpointDate = new Date(checkpoint.updatedAt);

  const localsMap = new Map(locals.map((file) => [file.uuid, file]));
  const itemsToSync = remotes.filter((remote) => isItemToSync({ ctx, type, localsMap, remote, checkpointDate }));

  return itemsToSync;
}
