CREATE TABLE
  IF NOT EXISTS "drive_file" (
    "id" INTEGER NOT NULL,
    "uuid" VARCHAR PRIMARY KEY NOT NULL,
    "status" VARCHAR NOT NULL,
    "plainName" VARCHAR,
    "type" VARCHAR DEFAULT (''),
    "createdAt" VARCHAR NOT NULL,
    "updatedAt" VARCHAR NOT NULL,
    "folderUuid" VARCHAR,
    "workspaceId" VARCHAR DEFAULT (''),
    "fileId" VARCHAR NOT NULL,
    "size" INTEGER NOT NULL,
    "folderId" INTEGER NOT NULL,
    /**
     * v2.5.1 Daniel Jiménez
     * We mark this field as empty to allow the migration to complete.
     * However, the value is populated by a custom migration on the startup.
     */
    "userUuid" VARCHAR NOT NULL DEFAULT (''),
    "modificationTime" VARCHAR NOT NULL
  );


CREATE TABLE
  IF NOT EXISTS "drive_folder" (
    "id" INTEGER NOT NULL,
    "uuid" VARCHAR PRIMARY KEY NOT NULL,
    "status" VARCHAR NOT NULL,
    "plainName" VARCHAR,
    "createdAt" VARCHAR NOT NULL,
    "updatedAt" VARCHAR NOT NULL,
    "parentUuid" VARCHAR,
    "workspaceId" VARCHAR DEFAULT (''),
    "parentId" INTEGER,
    /**
     * v2.5.1 Daniel Jiménez
     * We mark this field as empty to allow the migration to complete.
     * However, the value is populated by a custom migration on the startup.
     */
    "userUuid" VARCHAR NOT NULL DEFAULT (''),
    CONSTRAINT "UQ_7a0c089191f5ebdc214e0af808a" UNIQUE ("id")
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