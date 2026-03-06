import os from 'node:os';

import { logger } from '@internxt/drive-desktop-core/build/backend';

const INTERVAL = 60 * 1000;

function measureEventLoopLag() {
  return new Promise<number>((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
      resolve(lag);
    });
  });
}

function getWarnings(lag: number, memUsage: NodeJS.MemoryUsage) {
  const warnings: string[] = [];

  if (lag > 100) warnings.push('HIGH EVENT LOOP LAG');
  if (lag > 500) warnings.push('CRITICAL EVENT LOOP LAG: main process likely frozen');

  const heapMB = memUsage.heapUsed / 1024 / 1024;
  if (heapMB > 500) warnings.push(`HIGH HEAP: ${heapMB.toFixed(0)}MB`);
  if (os.freemem() < 200 * 1024 * 1024) warnings.push('LOW SYSTEM MEMORY');

  return warnings;
}

async function logHealth() {
  const memUsage = process.memoryUsage();
  const lag = await measureEventLoopLag();
  const cpus = os.cpus();
  const avgCpuLoad = os.loadavg()[0];

  logger.debug({
    msg: 'Measure health',
    eventLoopLag_ms: lag.toFixed(2),
    memory: {
      heapUsed_MB: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
      heapTotal_MB: (memUsage.heapTotal / 1024 / 1024).toFixed(1),
      rss_MB: (memUsage.rss / 1024 / 1024).toFixed(1),
      external_MB: (memUsage.external / 1024 / 1024).toFixed(1),
    },
    system: {
      freeMem_MB: (os.freemem() / 1024 / 1024).toFixed(0),
      totalMem_MB: (os.totalmem() / 1024 / 1024).toFixed(0),
      cpuCores: cpus.length,
      loadAvg_1m: avgCpuLoad.toFixed(2),
    },
    uptime_s: Math.floor(process.uptime()),
    warnings: getWarnings(lag, memUsage),
  });
}

export function measureHealth() {
  void logHealth();
  setInterval(() => logHealth(), INTERVAL);
}
