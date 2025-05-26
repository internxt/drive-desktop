export type MainProcessBackupsMessages = {
  'backups.get-last-progress': () => void;
  'backups.clear-backup-issues': () => void;
};
