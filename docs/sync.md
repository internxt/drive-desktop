# Sync

## Sources of truth

1. drive-server-wip (an item has status EXISTS, TRASHED or DELETED)
2. SQLite (an item has status EXISTS, TRASHED or DELETED)
3. File explorer (an item has PinState, SyncState and a placeholderId if it's already in remote)

## Flow

1. Sync -> SQLite -> Create/remove placeholders
2. Add file -> Network -> Server -> Create placeholder
3. Move file -> Server -> (placeholder is already created) 
4. Remove file -> Server -> SQLite

## From remote to local

We fetch ALL changes from a checkpoint. If there is not checkpoint, it means that is the first time the user has the app, so we only fetch EXISTS.

*Issues*
  - If the user uninstall the app, the items are kept, but the checkpoint is lost, so we can't sync the TRASHED items.

*Irrelevant*
  - The user removes an item but it's not yet in remote. The sync is going to create the placeholder until the next sync.
  - The user moves an item from location1 to location2, it gets updated in remote, then moves the item from location2 to location3 and the sync starts before it's updated in remote. The sync is going to create the placeholder in location2 until the next sync.

*Solved*
  - The user adds an item but it's not yet in remote. The sync is not going to do anything, because the item is not in SQLite.

---

Since we may lose the checkpoint, we have a background sync that retrieves all EXISTS from a folder.

*Issues*
  - We can't create an item because we will lose the checkpoint.
  - We always start the sync from the root folder so maybe we don't reach deep folders.

*Irrelevant*
  - The user removes an item but it's not yet in remote. The sync is going to create the placeholder until the next sync.
  - The user moves a file from location1 to location2 but it's not yet in remote. The sync is going to create a placeholder in the location1 until next sync.
