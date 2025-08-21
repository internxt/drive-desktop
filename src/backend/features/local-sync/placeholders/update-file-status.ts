import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Props = {
  path: RelativePath;
};

export function updateFileStatus({ path }: Props) {
  virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
}
