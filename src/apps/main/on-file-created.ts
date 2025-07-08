import { join } from 'path';
import configStore from './config';
import { isAbsolutePath } from './util';
import { createAndUploadThumbnail } from './thumbnails/application/create-and-upload-thumbnail';
import { broadcastToWindows } from './windows';

export async function onFileCreated(payload: {
  bucket: string;
  name: string;
  extension: string;
  nameWithExtension: string;
  fileId: number;
  path: string;
}) {
  const { bucket, nameWithExtension, fileId } = payload;

  let fullPath = payload.path;

  if (!isAbsolutePath(fullPath)) {
    const root = configStore.get('syncRoot');
    fullPath = join(root, fullPath);
  }

  await createAndUploadThumbnail(bucket, fileId, nameWithExtension, fullPath);

  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'UPLOADED', name: nameWithExtension },
  });
}
