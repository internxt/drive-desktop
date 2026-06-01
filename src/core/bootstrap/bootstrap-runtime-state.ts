export type PendingUpdateInfo = { version: string } | null;

let pendingUpdateInfo: PendingUpdateInfo = null;

export function getPendingUpdateInfo() {
  return pendingUpdateInfo;
}

export function setPendingUpdateInfo(updateInfo: Exclude<PendingUpdateInfo, null>) {
  pendingUpdateInfo = updateInfo;
}
