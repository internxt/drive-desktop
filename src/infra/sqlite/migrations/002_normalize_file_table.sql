/**
 * v2.6.8 Daniel Jiménez
 * As explained in the `schema.ts` file we had issues with migrations that were not run.
 * We are going to normalize tables so we ensure that every user using the desktop app
 * has the same schema for the sqlite. Also, we are going to remove all NULL values since
 * a bad use of them can lead to having empty and NULL values in the same column. It's
 * true that NULL values have some benefits, but a wrong usage implies a never ending of
 * cleaning migrations, while a wrong usage of an empty value can be solved in a release
 * without having to touch the database. We can even parse the database data to convert
 * the empty values to `null` or `undefined` in case we want the type inference.
 */
CREATE TABLE
  drive_file_new (
    id INTEGER NOT NULL,
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    status VARCHAR(7) NOT NULL,
    plainName VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    createdAt VARCHAR(24) NOT NULL,
    updatedAt VARCHAR(24) NOT NULL,
    folderUuid VARCHAR(36) NOT NULL,
    workspaceId VARCHAR(36) NOT NULL,
    fileId VARCHAR(24) NOT NULL,
    size INTEGER NOT NULL,
    folderId INTEGER NOT NULL,
    userUuid VARCHAR(36) NOT NULL,
    modificationTime VARCHAR(24) NOT NULL
  );


-- Copy data + normalize NULLs → ''
INSERT INTO
  drive_file_new (
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
  )
SELECT
  id,
  uuid,
  status,
  COALESCE(plainName, ''),
  COALESCE(type, ''),
  createdAt,
  updatedAt,
  COALESCE(folderUuid, ''),
  COALESCE(workspaceId, ''),
  fileId,
  size,
  folderId,
  COALESCE(userUuid, ''),
  modificationTime
FROM
  drive_file;


DROP TABLE
  drive_file;


ALTER TABLE
  drive_file_new RENAME TO drive_file;