export default function useBackupFatalErrors() {
  // const [errors, setErrors] = useState<BackupFatalError[]>([]);

  function thereAreErrors() {
    return [].length > 0;
  }

  function deleteError(_folderId: number) {
    // no-op
  }

  return { backupFatalErrors: [], thereAreErrors, deleteError };
}
