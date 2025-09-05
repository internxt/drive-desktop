import { BackupsContext } from '../BackupInfo';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  context: BackupsContext;
  deleted: Array<ExtendedDriveFile>;
};

export async function deleteRemoteFiles({ context, deleted }: TProps) {
  for (const file of deleted) {
    if (context.abortController.signal.aborted) {
      return;
    }

    await driveServerWip.storage.deleteFileByUuid({
      uuid: file.uuid,
      workspaceToken: '',
    });
  }
}
