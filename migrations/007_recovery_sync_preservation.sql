-- Destination directory of the preserved items of a sync context on one volume, deleted with the rest of its recovery state.
-- Moves stay on the volume of their source, so a context whose items live on several volumes has one row per volume.
CREATE TABLE recovery_sync_destination (
  rootUuid VARCHAR(36) NOT NULL,
  -- Volume root of the sources, for example 'C:'.
  volume VARCHAR(3) NOT NULL,
  -- Full path allocated the first time an item of this volume needed it, reused as is after a restart instead of being rebuilt.
  path TEXT NOT NULL,
  PRIMARY KEY (rootUuid, volume)
) WITHOUT ROWID;

-- Journal of the preservation moves of a sync context, written before touching the filesystem so an interrupted move can be resumed.
CREATE TABLE recovery_sync_move (
  rootUuid VARCHAR(36) NOT NULL,
  itemType VARCHAR(6) NOT NULL CHECK (itemType IN ('file', 'folder')),
  uuid VARCHAR(36) NOT NULL,
  source TEXT NOT NULL,
  -- Allocated for this move only, so an existing destination after a restart means this move already happened.
  destination TEXT NOT NULL UNIQUE,
  -- Status written to the local item once its contents are preserved.
  removalStatus VARCHAR(7) NOT NULL CHECK (removalStatus IN ('TRASHED', 'DELETED')),
  -- Size and modification time of the source when the move was reserved; a source that changed since is left in place.
  -- NULL for folders.
  sourceSize INTEGER,
  sourceModifiedAt VARCHAR(24),
  -- reserved -> moved -> done, or conflict when the item changed and failed when the move could not be done.
  stage VARCHAR(8) NOT NULL DEFAULT 'reserved' CHECK (stage IN ('reserved', 'moved', 'done', 'conflict', 'failed')),
  PRIMARY KEY (rootUuid, itemType, uuid)
) WITHOUT ROWID;
