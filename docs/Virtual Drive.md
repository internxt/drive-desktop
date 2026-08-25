---
date: 2026-08-17T13:48:00
tags:
  - Internxt
  - Docs
---

The Virtual Drive is the layer that makes the files from internxt available to the local file explorer.

IT uses the Windows Cloud Files API (CFAPI), the docs are available in their [github repo](https://github.com/MicrosoftDocs/win32/tree/docs/desktop-src/cfApi) and more info can be found in this [Cloud files API architecture](https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/cfApi/build-a-cloud-file-sync-engine.md#cloud-files-api-architecture) section

**in short**: we use cfapi to expose the remote drive as a regular local folder. Files and folders can appear in Explorer even when their contents are not stored locally yet.

## Sync root

A **sync root** is the local folder registered in Windows as belonging to a cloud-storage provider (in our case Internxt)

In our case, a sync root is the folder that the users will see as their Drive in their file exporer. For example they will see `InternxtDrive - <userUuid>`. Once it is registered, windows will know that:

- Internxt owns the cloud representation of the items in that folder (As we are their provider)
- Internxt can create placeholders there.
- Windows must ask Internxt for a files contents when needed.

The syncroot location is obtained in [finishOnboarding](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/windows/index.ts#L19) when the user first installs the app or it can be changed into a new place with [chooseSyncRootWithDialog](https://github.com/internxt/drive-desktop/blob/main/src/apps/main/virtual-root-folder/service.ts#L39)

### Info to consider

As per the the [official docs](https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/cfApi/build-a-cloud-file-sync-engine.md#cloud-files-api-architecture:~:text=Cldflt.sys%20currently%20only%20supports%20NTFS%20volumes%20because%20it%20depends%20on%20some%20features%20unique%20to%20NTFS.)

> Cldflt.sys currently only supports NTFS volumes because it depends on some features unique to NTFS.

So in short: The new location must be a nfts volume, other formats (For example fat32) wont be elegible to be a syncroot and the user will have problems using the app.

## What is a Placeholder?

A placeholder is a local file or folder entry that represents a remote item. It has enough metadata for Explorer to show it—such as name, type, size, dates, and identity without necessarily containing the actual file data. This is what the sync engine creates and updates placeholders after remote state is stored in SQLite. (_see: [refreshItemPlaceholders](https://github.com/internxt/drive-desktop/blob/main/src/apps/sync-engine/refresh-item-placeholders.ts#L14)_)

## Hydrate / de-hydrate

When a user tries to open a file that is not hydrated, Windows sends a request to the app through [notify_fetch_data_call](https://github.com/internxt/drive-desktop/blob/main/packages/addon/include/virtual_drive/register_fetch_data_callback.h#L139).Then, the native addon forwards that request to the Desktop App (Now we are in electron), which finds the corresponding sync worker, downloads the file content, and streams it back to Windows. The file is then hydrated (available locally) (_see: [fetchDataFn_](https://github.com/internxt/drive-desktop/blob/main/src/node-win/callbacks.ts#L7) and [fetchData](https://github.com/internxt/drive-desktop/blob/main/src/apps/sync-engine/callbacks/fetchData.service.ts#L14))

For Dehydration: it removes the local file content while keeping its placeholder and metadata, so the file remains visible in Explorer and can be downloaded again when needed (_see: [handleDehydrate_](https://github.com/internxt/drive-desktop/blob/main/src/apps/sync-engine/callbacks/handle-dehydrate.ts#L10))

## providerId

This is the identifier Windows uses for one Internxt sync-root registration. It is generated from the user UUID for the personal Drive. this way, the app uses it to find, unregister, and re-register a sync root (Internxt Drive Folder). (_see: [registerSyncRoot](https://github.com/internxt/drive-desktop/blob/main/src/infra/node-win/services/register-sync-root.ts#L21)_)
