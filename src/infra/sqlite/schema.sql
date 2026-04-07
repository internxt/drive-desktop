CREATE TABLE
  IF NOT EXISTS "checkpoint" (
    "id" integer PRIMARY KEY NOT NULL,
    "type" varchar NOT NULL,
    "name" varchar NOT NULL,
    "updatedAt" varchar NOT NULL,
    "userUuid" varchar NOT NULL,
    "workspaceId" varchar NOT NULL,
    CONSTRAINT "UQ_43c08f91dd8c7539e31bbd9eaba" UNIQUE ("type", "userUuid", "workspaceId")
  );


CREATE TABLE
  migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    run_at TEXT NOT NULL DEFAULT (datetime('now'))
  );


CREATE TABLE
  IF NOT EXISTS "drive_file" (
    id INTEGER NOT NULL,
    uuid VARCHAR PRIMARY KEY NOT NULL,
    status VARCHAR NOT NULL,
    plainName VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    createdAt VARCHAR NOT NULL,
    updatedAt VARCHAR NOT NULL,
    folderUuid VARCHAR NOT NULL,
    workspaceId VARCHAR NOT NULL,
    fileId VARCHAR NOT NULL,
    size INTEGER NOT NULL,
    folderId INTEGER NOT NULL,
    userUuid VARCHAR NOT NULL,
    modificationTime VARCHAR NOT NULL
  );


CREATE TABLE
  IF NOT EXISTS "drive_folder" (
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


/* No STAT tables available */