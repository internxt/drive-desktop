import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { FileContentsId } from '../../domain/FileContentsId';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

export async function simpleFileOverride(file: File, contentsId: string, size: number): Promise<void> {
  file.changeContents(new FileContentsId(contentsId), new FileSize(size));

  await driveServerWip.files.replaceFile({
    uuid: file.uuid,
    newContentId: file.contentsId,
    newSize: file.size,
  });
}
