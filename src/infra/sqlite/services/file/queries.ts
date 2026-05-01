export const upsertQuery = `
INSERT INTO drive_file (
  id,
  uuid,
  status,
  plainName,
  type,
  createdAt,
  updatedAt,
  folderUuid,
  workspaceId,
  fileId,
  size,
  folderId,
  userUuid,
  modificationTime
) VALUES (
  :id,
  :uuid,
  :status,
  :plainName,
  :type,
  :createdAt,
  :updatedAt,
  :folderUuid,
  :workspaceId,
  :fileId,
  :size,
  :folderId,
  :userUuid,
  :modificationTime
)
ON CONFLICT (uuid) DO UPDATE SET
  id = excluded.id,
  status = excluded.status,
  plainName = excluded.plainName,
  type = excluded.type,
  createdAt = excluded.createdAt,
  updatedAt = excluded.updatedAt,
  folderUuid = excluded.folderUuid,
  workspaceId = excluded.workspaceId,
  fileId = excluded.fileId,
  size = excluded.size,
  folderId = excluded.folderId,
  userUuid = excluded.userUuid,
  modificationTime = excluded.modificationTime;
`;
