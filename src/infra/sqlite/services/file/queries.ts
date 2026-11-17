export const upsertQuery = `
INSERT INTO drive_file (
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
  userUuid,
  modificationTime,
  creationTime
) VALUES (
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
  :userUuid,
  :modificationTime,
  :creationTime
)
ON CONFLICT (uuid) DO UPDATE SET
  status = excluded.status,
  plainName = excluded.plainName,
  type = excluded.type,
  createdAt = excluded.createdAt,
  updatedAt = excluded.updatedAt,
  folderUuid = excluded.folderUuid,
  workspaceId = excluded.workspaceId,
  fileId = excluded.fileId,
  size = excluded.size,
  userUuid = excluded.userUuid,
  modificationTime = excluded.modificationTime,
  creationTime = excluded.creationTime;
`;
