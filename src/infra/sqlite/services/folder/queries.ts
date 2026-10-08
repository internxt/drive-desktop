export const upsertQuery = `
INSERT INTO drive_folder (
  uuid,
  id,
  workspaceId,
  parentId,
  parentUuid,
  userUuid,
  createdAt,
  updatedAt,
  plainName,
  status,
  creationTime,
  modificationTime
) VALUES (
  :uuid,
  :id,
  :workspaceId,
  :parentId,
  :parentUuid,
  :userUuid,
  :createdAt,
  :updatedAt,
  :plainName,
  :status,
  :creationTime,
  :modificationTime
)
ON CONFLICT (uuid) DO UPDATE SET
  id = excluded.id,
  workspaceId = excluded.workspaceId,
  parentId = excluded.parentId,
  parentUuid = excluded.parentUuid,
  userUuid = excluded.userUuid,
  createdAt = excluded.createdAt,
  updatedAt = excluded.updatedAt,
  plainName = excluded.plainName,
  status = excluded.status,
  creationTime = excluded.creationTime,
  modificationTime = excluded.modificationTime;
`;
