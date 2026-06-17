export function mb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function snapshot(label: string) {
  const memory = process.memoryUsage();

  return {
    label,
    heapUsedMB: mb(memory.heapUsed),
    heapTotalMB: mb(memory.heapTotal),
    processMemoryMB: mb(memory.rss),
  };
}
