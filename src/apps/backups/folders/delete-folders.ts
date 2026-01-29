import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { BackupsContext } from '../BackupInfo';
import { scheduleRequest } from '../schedule-request';

type TProps = {
  ctx: BackupsContext;
  deleted: Array<ExtendedDriveFolder>;
};

export async function deleteFolders({ ctx, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (folder) => {
      const path = folder.absolutePath;

      try {
        await scheduleRequest({ ctx, fn: () => deleteFolderByUuid({ ctx, uuid: folder.uuid, path }) });
      } catch (error) {
        ctx.logger.error({ msg: 'Error deleting folder', path, error });
      }
    }),
  );
}
