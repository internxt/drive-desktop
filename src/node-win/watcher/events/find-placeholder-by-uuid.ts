import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { readdir } from '@/infra/file-system/original-fs';
import { NodeWin } from '@/infra/node-win/node-win.module';

type Props = {
  folder: AbsolutePath;
  uuid: FileUuid;
};

export async function findPlaceholderByUuid({ folder, uuid }: Props) {
  let entries: string[];
  try {
    entries = await readdir(folder);
  } catch (error) {
    return { error: new Error('Cannot read folder', { cause: error }) };
  }

  for (const entry of entries) {
    const path = join(folder, entry);
    const { data: placeholder } = await NodeWin.getFileInfo({ path });
    if (placeholder?.uuid === uuid) return { data: path };
  }

  return { data: undefined };
}
