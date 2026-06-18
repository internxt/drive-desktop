import pLimit from 'p-limit';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { traverse } from '../Traverser';
import { createTree, TreeOptions, TraverserTestDataset } from './create-datasets';
import { MemorySnapshot, snapshot } from './performance-metrics';

export const CUSTOMER_SCALE_TREE: TreeOptions = {
  folderCount: 18_602,
  fileCount: 205_958,
  maxDepth: 17,
  hotFolderCount: 3,
  filesPerHotFolder: 30_000,
};

export async function generateDatasetAndRunBenchmakr(options: TreeOptions = CUSTOMER_SCALE_TREE) {
  collectGarbage();
  const beforeGenerate = snapshot('before dataset generation');
  const dataset = createTree(options);
  const afterGenerate = snapshot('after dataset generation');

  return await runBenchmark(dataset, [beforeGenerate, afterGenerate]);
}

async function runBenchmark(dataset: TraverserTestDataset, initialMemory: MemorySnapshot[]) {
  const { rootUuid, files, folders } = dataset;
  const ctx = {
    rootPath: abs('/drive'),
    rootUuid,
    abortController: new AbortController(),
    logger: {
      debug: () => undefined,
      error: () => undefined,
    },
  };

  collectGarbage();
  const beforeTraverse = snapshot('before traversal');
  const start = performance.now();

  await traverse({
    ctx: ctx as never,
    database: { files, folders },
    fileExplorer: { files: new Map(), folders: new Map() },
    currentFolder: { absolutePath: abs('/drive'), uuid: rootUuid },
    isFirstExecution: true,
    limit: pLimit(20),
  });

  const durationMs = Math.round(performance.now() - start);
  const afterTraverse = snapshot('after traversal');
  collectGarbage();
  const afterGc = snapshot('after explicit GC');
  const memory = [...initialMemory, beforeTraverse, afterTraverse, afterGc];

  console.log(`\n Traverser performance benchmark`);
  console.log(`Items: ${files.length.toLocaleString()} files, ${folders.length.toLocaleString()} folders`);
  console.table(memory);
  console.log(`Traversal duration: ${durationMs.toLocaleString()} ms`);

  return { durationMs, files: files.length, folders: folders.length, memory };
}

function collectGarbage() {
  globalThis.gc?.();
}
