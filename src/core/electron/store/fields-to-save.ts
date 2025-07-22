// Fields to persist between user sessions
export const fieldsToSave = [
  'backupsEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'lastSync',
  'deviceId',
  'deviceUuid',
  'backupList',
] as const;
