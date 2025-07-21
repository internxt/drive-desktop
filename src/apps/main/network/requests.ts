import { logger } from '@/apps/shared/logger/logger';
import { createHash } from 'crypto';
import { getFileMirrors } from './get-file-mirrors';
import { replaceMirror } from './replace-mirror';

export type FileInfo = {
  bucket: string;
  mimetype: string;
  filename: string;
  frame: string;
  size: number;
  id: string;
  created: Date;
  hmac: {
    value: string;
    type: string;
  };
  erasure?: {
    type: string;
  };
  index: string;
};

export type NetworkCredentials = {
  user: string;
  pass: string;
};

export function sha256(input: Buffer): Buffer {
  return createHash('sha256').update(input).digest();
}

function getAuthFromCredentials({ creds }: { creds: NetworkCredentials }): { Authorization: string } {
  const username = creds.user;
  const password = sha256(Buffer.from(creds.pass)).toString('hex');
  const base64 = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    Authorization: `Basic ${base64}`,
  };
}

async function getFileInfo({
  bucketId,
  fileId,
  opts,
}: {
  bucketId: string;
  fileId: string;
  opts?: { headers?: Record<string, string> };
}): Promise<FileInfo> {
  logger.info({ tag: 'BACKUPS', msg: `Fetching file info for bucketId downloadV1: ${bucketId}, fileId: ${fileId}` });
  const url = `${process.env.BRIDGE_URL}/buckets/${bucketId}/files/${fileId}/info`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(opts?.headers || {}),
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch file info: ${res.status} ${res.statusText}`);
  return res.json();
}

export function getFileInfoWithAuth({
  bucketId,
  fileId,
  creds,
}: {
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials;
}): Promise<FileInfo> {
  return getFileInfo({
    bucketId,
    fileId,
    opts: {
      headers: getAuthFromCredentials({ creds }),
    },
  });
}

export type Mirror = {
  index: number;
  replaceCount: number;
  hash: string;
  size: number;
  parity: boolean;
  token: string;
  healthy?: boolean;
  farmer: {
    userAgent: string;
    protocol: string;
    address: string;
    port: number;
    nodeID: string;
    lastSeen: Date;
  };
  url: string;
  operation: string;
};

export async function getMirrors({
  bucketId,
  fileId,
  creds,
  token,
}: {
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials | null;
  token?: string;
}): Promise<Mirror[]> {
  const mirrors: Mirror[] = [];
  const limit = 3;

  let results: Mirror[] = [];
  const headers: Record<string, string> = {
    ...(creds ? getAuthFromCredentials({ creds }) : {}),
    ...(token ? { 'x-token': token } : {}),
  };

  do {
    results = (
      await getFileMirrors({
        bucketId,
        fileId,
        limit,
        skip: mirrors.length,
        excludeNodes: [],
        opts: { headers },
      })
    )
      .filter((m) => !m.parity)
      .sort((mA, mB) => mA.index - mB.index);

    results.forEach((r) => mirrors.push(r));
  } while (results.length > 0);

  for (const mirror of mirrors) {
    const farmerIsOk = isFarmerOk(mirror.farmer);

    if (farmerIsOk) {
      mirror.farmer.address = mirror.farmer.address.trim();
    } else {
      mirrors[mirror.index] = await replaceMirror({
        bucketId,
        fileId,
        pointerIndex: mirror.index,
        excludeNodes: [],
        opts: { headers },
      });

      if (!isFarmerOk(mirrors[mirror.index].farmer)) {
        throw new Error('Missing pointer for shard %s' + mirror.hash);
      }

      if (!mirrors[mirror.index].url) {
        throw new Error('Missing download url for shard %s' + mirror.hash);
      }
    }
  }

  return mirrors;
}

function isFarmerOk(farmer?: Partial<Mirror['farmer']>) {
  return farmer && farmer.nodeID && farmer.port && farmer.address;
}
