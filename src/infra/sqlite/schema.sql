CREATE TABLE
  IF NOT EXISTS "drive_file" (
    "id" integer NOT NULL,
    "uuid" varchar PRIMARY KEY NOT NULL,
    "status" varchar NOT NULL,
    "plainName" varchar,
    "type" varchar DEFAULT (''),
    "createdAt" varchar NOT NULL,
    "updatedAt" varchar NOT NULL,
    "folderUuid" varchar,
    "workspaceId" varchar DEFAULT (''),
    "fileId" varchar NOT NULL,
    "size" integer NOT NULL,
    "folderId" integer NOT NULL,
    "userUuid" varchar NOT NULL DEFAULT (''),
    "modificationTime" varchar NOT NULL
  );


CREATE TABLE
  IF NOT EXISTS "drive_folder" (
    "uuid" varchar PRIMARY KEY NOT NULL,
    "id" integer NOT NULL,
    "workspaceId" varchar DEFAULT (''),
    "parentId" integer,
    "parentUuid" varchar,
    "userUuid" varchar NOT NULL DEFAULT (''),
    "createdAt" varchar NOT NULL,
    "updatedAt" varchar NOT NULL,
    "plainName" varchar,
    "status" varchar NOT NULL,
    CONSTRAINT "UQ_7a0c089191f5ebdc214e0af808a" UNIQUE ("id")
  );


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


/* No STAT tables available */