CREATE TABLE
  migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    run_at TEXT NOT NULL DEFAULT (datetime('now'))
  );


CREATE TABLE
  IF NOT EXISTS "checkpoint" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "type" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "updatedAt" VARCHAR NOT NULL,
    "userUuid" VARCHAR NOT NULL,
    "workspaceId" VARCHAR NOT NULL,
    CONSTRAINT "UQ_43c08f91dd8c7539e31bbd9eaba" UNIQUE ("type", "userUuid", "workspaceId")
  );


CREATE TABLE
  IF NOT EXISTS "drive_file" (
    id INTEGER NOT NULL,
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    status VARCHAR(7) NOT NULL,
    plainName TEXT NOT NULL,
    type TEXT NOT NULL,
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


CREATE TABLE
  IF NOT EXISTS "drive_folder" (
    id INTEGER NOT NULL,
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    status VARCHAR(7) NOT NULL,
    plainName TEXT NOT NULL,
    createdAt VARCHAR(24) NOT NULL,
    updatedAt VARCHAR(24) NOT NULL,
    parentUuid VARCHAR(36) NOT NULL,
    workspaceId VARCHAR(36) NOT NULL,
    parentId INTEGER,
    userUuid VARCHAR(36) NOT NULL
  );


/* No STAT tables available */