import axios, { AxiosBasicCredentials, AxiosRequestConfig } from 'axios';
import { createHash } from 'crypto';

export interface FileInfo {
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
}

export interface NetworkCredentials {
  user: string;
  pass: string;
}

export function sha256(input: Buffer): Buffer {
  return createHash('sha256').update(input).digest();
}

function getAuthFromCredentials(
  creds: NetworkCredentials
): AxiosBasicCredentials {
  return {
    username: creds.user,
    password: sha256(Buffer.from(creds.pass)).toString('hex'),
  };
}

function getFileInfo(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  opts?: AxiosRequestConfig
): Promise<FileInfo> {
  const defaultOpts: AxiosRequestConfig = {
    method: 'GET',
    url: `${networkApiUrl}/buckets/${bucketId}/files/${fileId}/info`,
    maxContentLength: Infinity,
  };

  return axios
    .request<FileInfo>({ ...defaultOpts, ...opts })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      throw err;
    });
}

export function getFileInfoWithToken(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  token: string
): Promise<FileInfo> {
  return getFileInfo(networkApiUrl, bucketId, fileId, {
    headers: { 'x-token': token },
  });
}

export function getFileInfoWithAuth(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  creds: NetworkCredentials
): Promise<FileInfo> {
  return getFileInfo(networkApiUrl, bucketId, fileId, {
    auth: getAuthFromCredentials(creds),
  });
}

export interface Mirror {
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
}

export async function getMirrors(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  creds: NetworkCredentials | null,
  token?: string
): Promise<Mirror[]> {
  const mirrors: Mirror[] = [];
  const limit = 3;

  let results: Mirror[] = [];
  const requestConfig: AxiosRequestConfig = {
    auth: creds ? getAuthFromCredentials(creds) : undefined,
    headers: token ? { 'x-token': token } : {},
  };

  do {
    results = (
      await getFileMirrors(
        networkApiUrl,
        bucketId,
        fileId,
        limit,
        mirrors.length,
        [],
        requestConfig
      )
    )
      .filter((m) => !m.parity)
      .sort((mA, mB) => mA.index - mB.index);

    results.forEach((r) => {
      mirrors.push(r);
    });
  } while (results.length > 0);

  for (const mirror of mirrors) {
    const farmerIsOk = isFarmerOk(mirror.farmer);

    if (farmerIsOk) {
      mirror.farmer.address = mirror.farmer.address.trim();
    } else {
      mirrors[mirror.index] = await replaceMirror(
        networkApiUrl,
        bucketId,
        fileId,
        mirror.index,
        [],
        requestConfig
      );

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

async function replaceMirror(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  pointerIndex: number,
  excludeNodes: string[] = [],
  opts?: AxiosRequestConfig
): Promise<Mirror> {
  let mirrorIsOk = false;
  let mirror: Mirror;

  while (!mirrorIsOk) {
    const [newMirror] = await getFileMirrors(
      networkApiUrl,
      bucketId,
      fileId,
      1,
      pointerIndex,
      excludeNodes,
      opts
    );

    mirror = newMirror;
    mirrorIsOk =
      newMirror.farmer &&
      newMirror.farmer.nodeID &&
      newMirror.farmer.port &&
      newMirror.farmer.address
        ? true
        : false;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return mirror!;
}

function getFileMirrors(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  limit: number | 3,
  skip: number | 0,
  excludeNodes: string[] = [],
  opts?: AxiosRequestConfig
): Promise<Mirror[]> {
  const excludeNodeIds: string = excludeNodes.join(',');
  const path = `${networkApiUrl}/buckets/${bucketId}/files/${fileId}`;
  const queryParams = `?limit=${limit}&skip=${skip}&exclude=${excludeNodeIds}`;

  const defaultOpts: AxiosRequestConfig = {
    responseType: 'json',
    url: path + queryParams,
  };

  return axios
    .request<Mirror[]>({ ...defaultOpts, ...opts })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      throw err;
    });
}

function isFarmerOk(farmer?: Partial<Mirror['farmer']>) {
  return farmer && farmer.nodeID && farmer.port && farmer.address;
}
