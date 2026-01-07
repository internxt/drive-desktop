export async function measurePerfomance(fn: () => Promise<void>) {
  const startTime = performance.now();

  await fn();

  const endTime = performance.now();

  return (endTime - startTime) / 1000;
}
