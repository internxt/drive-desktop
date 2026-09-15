# 2. Do not sanitize windows names for unaddressable items

Date: 2026-09-10

## Status

Accepted

## Context

Some names our server accepts cannot be addressed on Windows. We create placeholders through `\\?\` device paths, which skip win32 name parsing, so a name ending in a space or a dot is stored verbatim. Explorer does parse, looks for the trimmed name, and reports that the item does not exist. That is BR-1796: a folder the user can see and cannot open or delete.

It is not only the item itself. A folder we refuse to create takes its whole subtree with it, so files the user never named badly stop arriving too. That is the data loss reported in BR-2245.

Two ways out were considered.

**Skip the item** and surface it as a sync issue, leaving the user to rename it in the web. This is what internxt/drive-desktop#1493 does, after measuring on Windows which names are actually unreachable: a trailing space or dot is, a leading space is not, so names that were being rejected for no reason now arrive.

**Sanitize the name locally**, so the item comes down under a name Windows can address — `Press U.S.` as `Press U.S`, with a numbered suffix when the cleaned name collides with a sibling. Nothing would be skipped and no subtree would be lost.

Sanitizing was implemented and then set aside, for three reasons. Two of them are about the product and would hold even if the implementation were perfect.

No other Internxt client renames anything. Web, mobile and the other desktop platforms all show the name as stored. A name we cleaned up would exist only on Windows, so the same item would appear under one name in the app and another everywhere else, and a path copied from one would not resolve in the other.

The user did not choose that name and would have no way to tell where it came from. A file they uploaded as `Press U.S.` appearing on their machine as `Press U.S`, or as `Press U.S(1)` when a sibling collides, reads as the app corrupting their data rather than working around a limitation of Windows. We would rather tell them the name cannot be used than change it behind their back.

The third reason is what the numbering costs.

The local name and the remote name stop being the same string, so every operation that starts from a local path has to work out which remote item it means. Deletion is the dangerous one: the watcher reports a path after the fact, the placeholder metadata is gone with the item, and the uuid along with it. Recovering the uuid means recomputing the whole sibling assignment and seeing which name is missing.

That assignment is positional. Given `Teaser`, `Teaser(1)`, `Teaser(2)`, `Teaser(3)`, deleting `Teaser(2)` leaves the remaining siblings to be renumbered on the next full traversal. Until that traversal runs, the database holds one set of siblings and the disk still shows the old numbering. A second deletion in that window recomputes to a shifted assignment and trashes the wrong item in the cloud. It fails silently, and it fails towards data loss.

## Decision

We do not sanitize names. The local name always equals the remote name, on every platform.

An item whose name does not meet the criteria we consider valid on Windows is not brought down to the desktop at all: no placeholder is created for it, and its subtree is not walked. Instead it is recorded as a sync issue against its full path, which the app groups by cause and lists in the issues panel. The item stays in the cloud, reachable from every other client, and the user resolves it by renaming it there.

The criteria are ours, and they are deliberately narrower than the list Windows documents as invalid. We reject the reserved characters and the control characters, which fail on creation, and names ending in a space or a dot, which win32 trims when looking them up. We accept everything else, including reserved device names like `CON` and `LPT1` and names beginning with a space, because measuring on Windows shows they are reachable once created.

Being narrow is the point. A name we reject costs the user its whole subtree, so rejecting one that actually works loses folders for nothing. The criteria are measured rather than taken from documentation for that reason, and the measurement is kept as a test so they cannot drift back.

## Consequences

Every local path maps back to exactly one remote item by name, so deletions and moves resolve without reconstructing anything. There is no window in which the disk and the database disagree about which sibling is which.

The cost is that unaddressable items still do not arrive, and neither does anything under them. The user is told through the issues panel, but the fix is theirs: rename the item in the web. The message shown there was corrected in internxt/drive-desktop-core#61, which had been describing a rule we no longer apply.

The third reason is the only one we know how to remove. If the local name stopped being how we identify items — storing the assigned name in sqlite, or taking the uuid from the Cloud Files delete notification (`CF_CALLBACK_TYPE_NOTIFY_DELETE` carries `FileIdentity`, which is where we write it) — the renumbering would no longer be able to resolve to the wrong item.

That is worth doing on its own merits, but it would not reopen this decision by itself. The two product reasons would still stand, and they are not ours to settle alone: showing a different name on Windows than everywhere else is a question for the whole product, not for the desktop client.
