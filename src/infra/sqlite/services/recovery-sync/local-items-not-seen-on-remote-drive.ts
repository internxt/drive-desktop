/**
 * v2.7.2 Alexis Mora
 * Local items that a completed scan did not see, or saw as TRASHED/DELETED, no longer exist remotely.
 * Items updated at or after the captured checkpoint are left to normal sync.
 * Items absent from the scan are treated as DELETED, matching the status the previous recovery assigned them.
 */
export function localItemsNotSeenOnRemoteDrive({ itemType }: { itemType: 'file' | 'folder' }) {
  const table = itemType === 'file' ? 'drive_file' : 'drive_folder';

  return `
    FROM ${table} i
    JOIN recovery_sync_scan s ON s.rootUuid = :rootUuid AND s.itemType = '${itemType}' AND s.completed = 1
    LEFT JOIN recovery_sync_observed o ON o.rootUuid = s.rootUuid AND o.itemType = s.itemType AND o.uuid = i.uuid
    WHERE i.userUuid = :userUuid
      AND i.workspaceId = :workspaceId
      AND i.status = 'EXISTS'
      AND julianday(i.updatedAt) < julianday(s.checkpoint)
      AND COALESCE(o.remoteStatus, 'DELETED') <> 'EXISTS'`;
}
