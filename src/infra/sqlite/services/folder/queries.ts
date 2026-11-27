export const upsertQuery = `
INSERT INTO drive_folder (
  uuid,
  workspaceId,
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
  :workspaceId,
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
  workspaceId = excluded.workspaceId,
  parentUuid = excluded.parentUuid,
  userUuid = excluded.userUuid,
  createdAt = excluded.createdAt,
  updatedAt = excluded.updatedAt,
  plainName = excluded.plainName,
  status = excluded.status,
  creationTime = excluded.creationTime,
  modificationTime = excluded.modificationTime;
`;
