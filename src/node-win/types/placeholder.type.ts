// https://learn.microsoft.com/en-us/windows/win32/api/cfapi/ne-cfapi-cf_pin_state
export enum PinState {
  Unspecified = 0,
  AlwaysLocal = 1,
  OnlineOnly = 2,
  Excluded = 3,
  Inherit = 4,
}

// https://learn.microsoft.com/en-us/windows/win32/api/cfapi/ne-cfapi-cf_in_sync_state
export enum InSyncState {
  NotSync = 0,
  Sync = 1,
}
