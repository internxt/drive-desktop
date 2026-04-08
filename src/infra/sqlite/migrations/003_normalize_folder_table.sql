CREATE TABLE
  drive_folder_new (
    id INTEGER NOT NULL,
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    status VARCHAR(7) NOT NULL,
    plainName VARCHAR NOT NULL,
    createdAt VARCHAR(24) NOT NULL,
    updatedAt VARCHAR(24) NOT NULL,
    parentUuid VARCHAR(36) NOT NULL,
    workspaceId VARCHAR(36) NOT NULL,
    parentId INTEGER,
    userUuid VARCHAR(36) NOT NULL
  );


-- Copy data + normalize NULLs → ''
INSERT INTO
  drive_folder_new (
    id,
    uuid,
    status,
    plainName,
    createdAt,
    updatedAt,
    parentUuid,
    workspaceId,
    parentId,
    userUuid
  )
SELECT
  id,
  uuid,
  status,
  COALESCE(plainName, ''),
  createdAt,
  updatedAt,
  COALESCE(parentUuid, ''),
  COALESCE(workspaceId, ''),
  parentId,
  COALESCE(userUuid, '')
FROM
  drive_folder;


DROP TABLE
  drive_folder;


ALTER TABLE
  drive_folder_new RENAME TO drive_folder;