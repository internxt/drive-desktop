import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Props = {
  ctx: ProcessSyncContext;
  path: RelativePath;
};

export function updateFileStatus({ ctx, path }: Props) {
  ctx.virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false });
}
