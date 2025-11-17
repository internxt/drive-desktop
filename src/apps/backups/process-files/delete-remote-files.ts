import { BackupsContext } from '../BackupInfo';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  context: BackupsContext;
  deleted: Array<ExtendedDriveFile>;
};

export async function deleteRemoteFiles({ context, deleted }: TProps) {
  for (const file of deleted) {
    if (context.abortController.signal.aborted) {
      return;
    }

    await deleteFileByUuid({ uuid: file.uuid, workspaceToken: '', path: file.absolutePath });
  }
}
