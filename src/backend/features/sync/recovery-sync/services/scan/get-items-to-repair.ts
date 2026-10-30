type RemoteItem = {
  uuid: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
  updatedAt: string;
};

type LocalItem = {
  uuid: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
  updatedAt: string;
};

/**
 * v2.7.2 Alexis Mora
 * Items at or after the captured checkpoint belong to normal sync, which may already hold a newer version.
 * Removed items are not repaired here: their remote status is only recorded as an observation so local contents
 * can be preserved before the local status changes.
 */
export function getRepairCandidates<T extends RemoteItem>({ remotes, checkpoint }: { remotes: T[]; checkpoint: string }) {
  const checkpointTime = Date.parse(checkpoint);
  return remotes.filter((remote) => remote.status === 'EXISTS' && Date.parse(remote.updatedAt) < checkpointTime);
}

/**
 * v2.7.2 Alexis Mora
 * A local row newer than the remote page is kept because it was written after this page was read.
 */
export function getItemsToRepair<T extends RemoteItem>({ candidates, locals }: { candidates: T[]; locals: LocalItem[] }) {
  const localsByUuid = new Map(locals.map((local) => [local.uuid, local]));

  return candidates.filter((remote) => {
    const local = localsByUuid.get(remote.uuid);
    if (!local) return true;

    const remoteTime = Date.parse(remote.updatedAt);
    const localTime = Date.parse(local.updatedAt);
    if (localTime === remoteTime) return local.status !== remote.status;
    return localTime < remoteTime;
  });
}
