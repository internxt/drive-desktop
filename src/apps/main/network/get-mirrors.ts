import { getAuthFromCredentials } from './get-auth-from-credentials';
import { getFileMirrors } from './get-file-mirrors';
import { replaceMirror } from './replace-mirror';
import { Mirror, NetworkCredentials } from './requests';

type Props = {
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials | null;
  token?: string;
};

export async function getMirrors({ bucketId, fileId, creds, token }: Props): Promise<Mirror[]> {
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
