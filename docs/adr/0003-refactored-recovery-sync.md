# 3. Preserve local contents before recovery sync removes items

Date: 2026-11-16

## Status

Accepted

## Context

Recovery sync is the manual action that compares the remote drive state with the local database (in other words, the local representation of the remote state) of a sync folder and repairs the differences. Normal sync only follows changes from its checkpoint onwards, so anything it missed before that point stays wrong until recovery sync corrects it.

The previous recovery sync marked every local item it could not find in the cloud as deleted. The placeholder refresh that followed then removed the item from disk. When the database was right, that was the intended result. When it was not, because the item had never been uploaded, because an upload failed half way, or because the cloud had lost it, the user lost real contents that existed only on their computer, and nothing told them it had happened.

Marking those items as removed is still necessary: otherwise the database keeps describing items the cloud does not have and normal sync keeps acting on them. The question was what to do with the contents on disk first.

Leaving the contents in place and only reporting the items would keep them inside the sync folder, so normal sync would upload them again or the next refresh would remove them anyway. Copying them out would double the disk use and take as long as the data is large, and a copy interrupted half way leaves two incomplete versions. Downloading online-only files just to keep them would turn a database repair into a full download of every removed item.

Also, the previous recovery sync was neither a resumable process nor a manual process. Originally it ran every time a sync folder started, for every workspace, which hurt users with many files and folders. Making it manual removed that cost at startup, but the run itself stayed slow: it paged with limit and offset and waited 30 seconds after every page, and if the app closed it had to start over.

## Decision

Before recovery sync marks a local item as removed, it moves whatever that item has on disk out of the sync folder, to `<drive>:\Internxt Recovery Sync <date>\`, keeping its path inside the Drive. With workspaces, each sync folder gets its own subfolder under the same dated folder.

The contents are moved with a rename, never copied. A rename is instant and atomic, but it cannot cross drives, so the recovery folder goes at the root of the drive that holds the sync folder, and only drive-letter volumes are supported. It can never be inside any sync folder, where normal sync would pick the items up again.

Only contents that exist on disk are moved, partly downloaded files included. Online-only files are marked as removed without downloading them. A removed folder is moved as a whole, files never uploaded included, unless something inside it still belongs in the Drive; then it stays and its removed files are moved one by one.

The scan asks the cloud for every item, whatever its status, and saves the status the cloud reports:

- The previous recovery sync asked only for items with status `EXISTS`, so any local item it did not see was marked `DELETED`. The new scan has no status filter, so it also receives trashed and deleted items. Each removed item is then marked the same way the cloud has it: `TRASHED` if it is in the cloud trash, `DELETED` if it was deleted or never showed up. Knowing the status also tells it whether an item it missed in the listing still exists in the cloud.

Recovery sync never decides against the user. Nothing is overwritten, and anything the user or normal sync changed during the run is left in the Drive, where normal sync keeps owning it. An item is only marked as removed after its move succeeded, and that update checks again that the item did not change in between.

Every move is written to a journal before it happens, and the scan saves its progress page by page. If the app closes in the middle, recovery sync resumes on the next start with the same date and folder, and normal sync is held back until it finishes. The watcher reads the same journal, so the moves recovery makes are not sent to the cloud trash as deletions.

### Differences with the previous recovery sync

- **What happens to removed items.** The old one marked them as `DELETED` in the database, and the placeholder refresh that followed removed them from disk, contents included. The new one moves the contents to the recovery folder first, and marks the item only after the move succeeds.
- **When it decides an item is removed.** The old one decided page by page. Each page of 1000 items was compared only with the local items whose UUID fell between the first and last UUID of that page. Local items between two pages, or outside the range of all pages, were never checked. The new one decides only after both scans are complete, against everything it saw.
- **Trashed vs deleted.** The old one only listed `EXISTS` items and marked everything else as `DELETED`. The new one keeps the cloud's status and marks items as `TRASHED` or `DELETED` to match.
- **Checkpoint.** The old one read the normal sync checkpoint again on every page, so the cutoff could move during the run. The new one saves it once when the scan starts and uses it for the whole run.
- **Pagination.** The old one used the deprecated `/files` and `/folders` with limit and offset, and waited 30 seconds after every page. With offset, every page makes the backend skip all the rows before it, so deeper pages get slower. The new one uses the cursor-based `/files/sync` and `/folders/sync` that normal sync uses, with no pause between pages.
- **Interruptions.** The old one had to start over if the app closed. The new one saves its scan progress and a journal of moves, and resumes at the next startup.
- **Feedback.** The old one only changed the sync status. The new one also adds sync issues for items it could not move and shows one notification at the end of the run.

## Consequences

No local contents are lost when the database and the cloud disagree. The worst case is that the user finds their files in a recovery folder and has to move them back into the Drive to upload them again. The notification at the end of the run says where they are and how many items went there.

The recovery folder sits outside the Drive, so the app does not clean it up. Every run with something to preserve creates a new dated folder, and it is up to the user to delete them.

Items that cannot be moved, for example because the sync folder is on a network share or a file is locked, stay where they are with their status unchanged and show up in the sync issues list. They are retried on the next run. Items left in place because they changed during the run are not reported at all: they are still in the Drive and normal sync handles them.

The recovery state lives in its own tables (process, scan, observations, moves and destinations), added in migrations 006 to 008. It is cleared when a sync folder finishes its run, so the next run always scans the cloud from the beginning.
