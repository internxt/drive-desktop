import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { BackupsContext } from '../BackupInfo';
import { scheduleRequest } from '../schedule-request';

type TProps = {
  ctx: BackupsContext;
  deleted: Array<ExtendedDriveFile>;
};

export async function deleteFiles({ ctx, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (file) => {
      const path = file.absolutePath;

      try {
        await scheduleRequest({ ctx, path, fn: () => deleteFileByUuid({ ctx, uuid: file.uuid, path }) });
      } catch (error) {
        ctx.logger.sentryError({ msg: 'Error deleting file', path, error }, { uuid: file.uuid, size: file.size });
      }
    }),
  );
}
