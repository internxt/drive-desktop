-- One row per sync context while its recovery sync is in progress, deleted with the rest of its recovery state once it completes.
CREATE TABLE recovery_sync_process (
  rootUuid VARCHAR(36) NOT NULL PRIMARY KEY,
  -- Time the manual run started, taken once for every context of that run and kept across restarts.
  -- It names the dated destination directory of preserved items, which every context of the run shares in its own rootUuid subfolder.
  startedAt VARCHAR(24) NOT NULL
) WITHOUT ROWID;
