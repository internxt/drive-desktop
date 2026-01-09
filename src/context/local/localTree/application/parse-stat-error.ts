import { BackupsContext } from '@/apps/backups/BackupInfo';
import { StatError } from '@/infra/file-system/services/stat';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: BackupsContext;
  path: AbsolutePath;
  error: StatError;
};

export function parseStatError({ ctx, path, error }: Props) {
  if (error.code === 'UNKNOWN') return;

  ctx.addIssue({
    name: path,
    error: (() => {
      switch (error.code) {
        case 'NON_EXISTS':
          return 'FOLDER_DOES_NOT_EXIST';
        case 'NO_ACCESS':
          return 'FOLDER_ACCESS_DENIED';
        default:
          return error.code;
      }
    })(),
  });
}
