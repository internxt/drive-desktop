import { getFileMirrors } from './get-file-mirrors';
import { Mirror } from './types';

type Props = {
  bucketId: string;
  fileId: string;
  pointerIndex: number;
  excludeNodes?: string[];
  opts?: { headers?: Record<string, string> };
};

export async function replaceMirror({ bucketId, fileId, pointerIndex, excludeNodes = [], opts }: Props): Promise<Mirror> {
  let mirrorIsOk = false;
  let mirror: Mirror;

  while (!mirrorIsOk) {
    const [newMirror] = await getFileMirrors({
      bucketId,
      fileId,
      limit: 1,
      skip: pointerIndex,
      excludeNodes,
      opts,
    });
    mirror = newMirror;
    mirrorIsOk = !!(newMirror.farmer && newMirror.farmer.nodeID && newMirror.farmer.port && newMirror.farmer.address);
  }

  return mirror!;
}
