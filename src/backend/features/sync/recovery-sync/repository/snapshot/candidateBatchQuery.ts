export function candidateBatchQuery({ selection }: { selection: 'all' | 'unobserved' | 'removed' }) {
  const filter = { all: '', unobserved: 'AND observed = 0', removed: 'AND removedStatus IS NOT NULL' }[selection];
  // v2.7.1: SQLite can otherwise choose the primary key and traverse the entire observed inventory to fill one cleanup batch.
  const index = { all: '', unobserved: 'INDEXED BY recovery_unobserved', removed: 'INDEXED BY recovery_removed' }[selection];
  return `SELECT * FROM recovery_candidate ${index} WHERE scanId = ? AND uuid > ? ${filter} ORDER BY uuid LIMIT ?`;
}
