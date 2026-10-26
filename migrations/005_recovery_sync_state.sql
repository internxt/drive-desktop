CREATE TABLE recovery_process (
  rootUuid TEXT PRIMARY KEY NOT NULL,
  startedAt TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'preparing' CHECK (stage IN ('preparing', 'scanning', 'preserving', 'reporting')),
  preservedFileCount INTEGER NOT NULL DEFAULT 0 CHECK (preservedFileCount >= 0)
);

CREATE TABLE recovery_scan (
  scanId INTEGER PRIMARY KEY AUTOINCREMENT,
  rootUuid TEXT NOT NULL REFERENCES recovery_process(rootUuid),
  userUuid TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  itemType TEXT NOT NULL CHECK (itemType IN ('file', 'folder')),
  checkpoint TEXT NOT NULL,
  preparationAfter TEXT NOT NULL DEFAULT '',
  preparationUpperBound TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'preparing' CHECK (stage IN ('preparing', 'scanning', 'completed')),
  updatedAt TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
  UNIQUE (rootUuid, itemType)
);

CREATE INDEX recovery_process_scans ON recovery_scan(rootUuid, stage);
CREATE INDEX recovery_file_inventory ON drive_file(userUuid, workspaceId, uuid);
CREATE INDEX recovery_folder_inventory ON drive_folder(userUuid, workspaceId, uuid);

CREATE TABLE recovery_candidate (
  scanId INTEGER NOT NULL REFERENCES recovery_scan(scanId),
  uuid TEXT NOT NULL,
  original TEXT NOT NULL CHECK (json_valid(original)),
  observed INTEGER NOT NULL DEFAULT 0 CHECK (observed IN (0, 1)),
  removedStatus TEXT CHECK (removedStatus IN ('TRASHED', 'DELETED')),
  removedAt TEXT,
  PRIMARY KEY (scanId, uuid)
) WITHOUT ROWID;

CREATE INDEX recovery_unobserved ON recovery_candidate(scanId, observed, uuid);
CREATE INDEX recovery_removed ON recovery_candidate(scanId, uuid) WHERE removedStatus IS NOT NULL;

CREATE TABLE recovery_destination (
  rootUuid TEXT NOT NULL REFERENCES recovery_process(rootUuid),
  volume TEXT NOT NULL COLLATE NOCASE,
  path TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created INTEGER NOT NULL DEFAULT 0 CHECK (created IN (0, 1)),
  PRIMARY KEY (rootUuid, volume)
) WITHOUT ROWID;

CREATE TABLE recovery_move (
  moveId INTEGER PRIMARY KEY AUTOINCREMENT,
  scanId INTEGER NOT NULL REFERENCES recovery_scan(scanId),
  uuid TEXT NOT NULL,
  volume TEXT NOT NULL COLLATE NOCASE,
  source TEXT NOT NULL COLLATE NOCASE,
  destination TEXT NOT NULL COLLATE NOCASE UNIQUE,
  expected TEXT NOT NULL CHECK (json_valid(expected)),
  removalStatus TEXT NOT NULL CHECK (removalStatus IN ('TRASHED', 'DELETED')),
  stage TEXT NOT NULL DEFAULT 'pending' CHECK (stage IN ('pending', 'moved', 'completed', 'conflict')),
  preservedFileCount INTEGER CHECK (preservedFileCount >= 0),
  watcherSettled INTEGER NOT NULL DEFAULT 0 CHECK (watcherSettled IN (0, 1)),
  UNIQUE (scanId, uuid)
);

CREATE INDEX recovery_pending_moves ON recovery_move(scanId, stage, moveId);
CREATE INDEX recovery_move_source ON recovery_move(source, moveId);
