export function getWorkerCount({ concurrency, itemCount }: { concurrency: number; itemCount: number }) {
  return Math.min(concurrency, itemCount);
}
