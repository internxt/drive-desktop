export function getInitialSyncUpdatedAt(from?: Date): string {
  return (from ?? new Date(0)).toISOString();
}
