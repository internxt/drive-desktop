import { File } from '@/context/virtual-drive/files/domain/File';
import { BackupsContext } from '../BackupInfo';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  context: BackupsContext;
  deleted: Array<File>;
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
