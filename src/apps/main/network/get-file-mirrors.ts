import { logger } from '@/apps/shared/logger/logger';
import { Mirror } from './requests';

type Props = {
  bucketId: string;
  fileId: string;
  limit: number;
  skip: number;
  excludeNodes?: string[];
  opts: { headers?: Record<string, string> };
};

export async function getFileMirrors({ bucketId, fileId, limit = 3, skip = 0, excludeNodes = [], opts }: Props): Promise<Mirror[]> {
  const excludeNodeIds: string = excludeNodes.join(',');
  const url = `${process.env.BRIDGE_URL}/buckets/${bucketId}/files/${fileId}?limit=${limit}&skip=${skip}&exclude=${excludeNodeIds}`;

  return await fetch(url, {
    method: 'GET',
    headers: {
      ...(opts.headers || {}),
    },
  }).then((res) => {
    if (!res.ok) throw logger.error({ msg: 'Failed to fetch file mirrors', status: res.status, statusText: res.statusText });
    return res.json();
  });
}
