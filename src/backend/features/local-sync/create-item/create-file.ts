import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createAndUploadThumbnail } from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { RemoteFileContents } from '@/context/virtual-drive/contents/domain/RemoteFileContents';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { createOrUpdateFile } from '../../remote-sync/update-in-sqlite/create-or-update-file';

export type CreateFileProps = {
  ctx: SyncContext;
  contents: RemoteFileContents;
  parentUuid: FolderUuid;
  path: RelativePath;
  absolutePath: AbsolutePath;
};

export async function createFile({ ctx, contents, parentUuid, path, absolutePath }: CreateFileProps) {
  const fileDto = await HttpRemoteFileSystem.persist({
    ctx,
    contentsId: contents.id,
    folderUuid: parentUuid,
    path,
    size: contents.size,
  });

  const res = await createOrUpdateFile({ context: ctx, fileDto });

  if (res.data) {
    await createAndUploadThumbnail({
      bucket: ctx.bucket,
      fileId: res.data.id,
      absolutePath,
    });
  }

  return res;
}
