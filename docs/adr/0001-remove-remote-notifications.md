# 1. remove remote notifications

Date: 2026-09-30

## Status

Accepted

## Context

Remote notifications were no longer actively used and added unnecessary maintenance complexity.

## Decision

Remove the remote notification websocket client and its event handling.

## Consequences

Remote file and folder changes are detected by the scheduled sync, which runs every 10 minutes, rather than immediately through websocket events. The maximum upload file size is refreshed when the user logs in, so a plan change made while the app remains open takes effect after the next login. Product availability is fetched independently from the payments API when needed and does not depend on remote notifications.
