import pLimit from 'p-limit';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { traverse } from '../Traverser';
import { createTree, TreeOptions } from './create-datasets';
import { BenchmarkMetrics, measure } from './performance-metrics';

export const CUSTOMER_SCALE_TREE: TreeOptions = {
  folderCount: 18_602,
  fileCount: 205_958,
  maxDepth: 17,
  hotFolderCount: 3,
  filesPerHotFolder: 30_000,
};

export async function generateDatasetAndRunBenchmark(options: TreeOptions = CUSTOMER_SCALE_TREE) {
  const dataset = createTree(options);
  const result = await runBenchmark(dataset);
  printResult(result, dataset);
  return result;
}

async function runBenchmark(dataset: ReturnType<typeof createTree>) {
  const ctx = {
    rootPath: abs('/drive'),
    rootUuid: dataset.rootUuid,
    abortController: new AbortController(),
    logger: {
      debug: () => undefined,
      error: () => undefined,
    },
  };

  return await measure(async () => {
    await traverse({
      ctx: ctx as never,
      database: { files: dataset.files, folders: dataset.folders },
      fileExplorer: { files: new Map(), folders: new Map() },
      currentFolder: { absolutePath: abs('/drive'), uuid: dataset.rootUuid },
      isFirstExecution: true,
      limit: pLimit(20),
    });
  });
}

function printResult(metrics: BenchmarkMetrics, dataset: ReturnType<typeof createTree>) {
  console.log('\nTraverser performance benchmark');
  console.log(`Items: ${dataset.files.length.toLocaleString()} files, ${dataset.folders.length.toLocaleString()} folders`);

  console.table([
    {
      durationMs: round(metrics.durationMs),
      cpuTotalMs: round(metrics.cpuTotalMs),
      peakHeapUsedMB: round(metrics.peakHeapUsedMB),
      peakRssMB: round(metrics.peakRssMB),
      gcCount: metrics.gcCount,
      gcTotalMs: round(metrics.gcTotalDurationMs),
      eventLoopMaxMs: round(metrics.eventLoopDelayMaxMs),
    },
  ]);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
