CREATE TABLE recovery_sync_scan (
  rootUuid VARCHAR(36) NOT NULL,
  itemType VARCHAR(6) NOT NULL CHECK (itemType IN ('file', 'folder')),
  -- Copy of the normal sync checkpoint (checkpoint.updatedAt) taken once when the scan starts and never updated afterwards.
  -- Normal sync keeps advancing its own checkpoint; recovery only cleans up local items older than this copy,
  -- so items written by normal sync after the scan started are left to normal sync.
  checkpoint VARCHAR(24) NOT NULL,
  -- Recovery scan progress: updatedAt of the last committed page, used to resume inclusively. Unrelated to the normal checkpoint.
  updatedAt VARCHAR(24) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  PRIMARY KEY (rootUuid, itemType)
) WITHOUT ROWID;

CREATE TABLE recovery_sync_observed (
  rootUuid VARCHAR(36) NOT NULL,
  itemType VARCHAR(6) NOT NULL CHECK (itemType IN ('file', 'folder')),
  uuid VARCHAR(36) NOT NULL,
  remoteStatus VARCHAR(7) NOT NULL CHECK (remoteStatus IN ('EXISTS', 'TRASHED', 'DELETED')),
  PRIMARY KEY (rootUuid, itemType, uuid)
) WITHOUT ROWID;
