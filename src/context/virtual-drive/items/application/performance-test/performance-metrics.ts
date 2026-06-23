import { monitorEventLoopDelay, performance, PerformanceObserver } from 'node:perf_hooks';

const MEMORY_SAMPLE_INTERVAL_MS = 25;
const NANOS_PER_MILLISECOND = 1_000_000;

export type BenchmarkMetrics = {
  durationMs: number;
  cpuTotalMs: number;
  peakHeapUsedMB: number;
  peakRssMB: number;
  gcCount: number;
  gcTotalDurationMs: number;
  eventLoopDelayMaxMs: number;
};

export async function measure(run: () => Promise<void>): Promise<BenchmarkMetrics> {
  collectGarbage();

  const peaks = process.memoryUsage();
  const gcDurations: number[] = [];
  const gcObserver = new PerformanceObserver((list) => {
    gcDurations.push(...list.getEntries().map(({ duration }) => duration));
  });
  const eventLoopDelay = monitorEventLoopDelay({ resolution: 10 });
  const sampleMemory = () => {
    const memory = process.memoryUsage();
    peaks.heapUsed = Math.max(peaks.heapUsed, memory.heapUsed);
    peaks.rss = Math.max(peaks.rss, memory.rss);
  };

  gcObserver.observe({ entryTypes: ['gc'] });
  eventLoopDelay.enable();
  const cpuBefore = process.cpuUsage();
  const start = performance.now();
  const sampler = setInterval(sampleMemory, MEMORY_SAMPLE_INTERVAL_MS);

  await run();

  const durationMs = performance.now() - start;
  const cpu = process.cpuUsage(cpuBefore);
  clearInterval(sampler);
  sampleMemory();
  await new Promise<void>((resolve) => setImmediate(resolve));
  eventLoopDelay.disable();
  gcObserver.disconnect();

  const result = {
    durationMs,
    cpuTotalMs: (cpu.user + cpu.system) / 1_000,
    peakHeapUsedMB: toMB(peaks.heapUsed),
    peakRssMB: toMB(peaks.rss),
    gcCount: gcDurations.length,
    gcTotalDurationMs: sum(gcDurations),
    eventLoopDelayMaxMs: nanosToMs(eventLoopDelay.max),
  };

  collectGarbage();
  return result;
}

function collectGarbage() {
  globalThis.gc?.();
  globalThis.gc?.();
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function nanosToMs(nanoseconds: number) {
  return nanoseconds / NANOS_PER_MILLISECOND;
}

function toMB(bytes: number) {
  return bytes / 1024 / 1024;
}
