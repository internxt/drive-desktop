export type MemorySnapshot = ReturnType<typeof snapshot>;

export function mb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function snapshot(label: string) {
  const memory = process.memoryUsage();

  return {
    label,
    heapUsedMB: mb(memory.heapUsed),
    heapTotalMB: mb(memory.heapTotal),
    rssMB: mb(memory.rss),
    externalMB: mb(memory.external),
  };
}
