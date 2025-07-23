import { logger } from '@/apps/shared/logger/logger';
import { FileInfo } from './requests';

type Props = {
  bucketId: string;
  fileId: string;
  opts: { headers?: Record<string, string> };
};

export async function getFileInfo({ bucketId, fileId, opts }: Props): Promise<FileInfo> {
  logger.info({ tag: 'BACKUPS', msg: `Fetching file info for bucketId downloadV1: ${bucketId}, fileId: ${fileId}` });
  const url = `${process.env.BRIDGE_URL}/buckets/${bucketId}/files/${fileId}/info`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) throw logger.error({ msg: 'Failed to fetch file info', status: res.status, statusText: res.statusText });
  return res.json();
}
