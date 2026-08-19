---
date: 2026-08-17T12:20
tags:
  - Internxt
  - Docs
---

The sync engine is the feature that is in charge of keeping the local drive and the remote drive up to date.

## Checkpoint

The checkpoint its just the last synced file/folder `updatedAt` value. With this value we will have a point to start from when syncing. Normally, when syncing we add a couple of minutes back this way we make sure that no file gets unsync.

## Remote -> local

In this part, the app requests changes from the backend using a Checkpoint (_see: [startSyncByCheckpoint](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/remote-sync/RemoteSyncManager.ts#L8))_ Then writes the current remote state to SQLite and then reconciles the local tree by creating/updating/removing placeholders (_see_ [updateRemoteSync](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/remote-sync/handlers.ts#L9))

## Local -> Remote

In this workflow, a native watcher (_see: [initWatcher](https://github.com/internxt/drive-desktop/blob/main/src/node-win/watcher/watcher.ts#L5)_) is observing changes inside the internxt drive folder. Once the mentioned watcher detects an event, it mapps to create/update/delete/rename handler which updates the remote drive and local state.

## Sync when app starts

When starting the desktop drive app. It immediately starts a remote-to-local sync, then repeats it every 10 minutes The workflow is as it follows:

- A sync worker is created for the personal Drive (and for each workspace) (_see: [spawnSyncEngineWorkers](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/background-processes/sync-engine.ts#L11)_)
- [spawnSyncEngineWorker](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/background-processes/sync-engine/services/spawn-sync-engine-worker.ts#L15) calls [scheduleSync](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/background-processes/sync-engine/services/schedule-sync.ts#L8) which is the function in charge of running every 10 minutes [updateRemoteSync](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/background-processes/sync-engine/services/schedule-sync.ts#L9)
- `updateRemoteSync` is in charge of starting a `Remote -> local` sync and with the given, updated info we refresh the placeholders so the Local File explorer matches the remote tree.
