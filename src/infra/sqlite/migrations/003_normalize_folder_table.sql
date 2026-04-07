CREATE TABLE
  drive_folder_new (
    id INTEGER NOT NULL,
    uuid VARCHAR PRIMARY KEY NOT NULL,
    status VARCHAR NOT NULL,
    plainName VARCHAR NOT NULL,
    createdAt VARCHAR NOT NULL,
    updatedAt VARCHAR NOT NULL,
    parentUuid VARCHAR NOT NULL,
    workspaceId VARCHAR NOT NULL,
    parentId INTEGER,
    userUuid VARCHAR NOT NULL
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