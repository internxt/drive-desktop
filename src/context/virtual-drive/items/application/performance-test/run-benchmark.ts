import pLimit from 'p-limit';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { traverse } from '../Traverser';
import { createDataset, TraverserTestDataset } from './create-datasets';
import { snapshot } from './performance-metrics';

export const TRAVERSER_PERF_FOLDERS = 10_000;
export const TRAVERSER_PERF_FILES = 130_000;

export async function runBenchmark(label: string, dataset: TraverserTestDataset) {
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

  globalThis.gc?.();
  const beforeTraverse = snapshot('before traverse');
  const start = performance.now();

  await traverse({
    ctx: ctx as never,
    database: { files, folders },
    fileExplorer: {
      files: new Map(),
      folders: new Map(),
    },
    currentFolder: { absolutePath: abs('/drive'), uuid: rootUuid },
    isFirstExecution: true,
    limit: pLimit(20),
  });

  globalThis.gc?.();

  const afterTraverse = snapshot('after traverse');
  const durationMs = Math.round(performance.now() - start);

  console.log(`Test for ${label} for files: ${files.length} folders: ${folders.length}`);
  console.table([beforeTraverse, afterTraverse]);
  console.log(`Result: durationMs: ${durationMs}`);
}

export async function runScenario(mode: 'broad' | 'deep') {
  globalThis.gc?.();
  const beforeGenerate = snapshot('before generate');
  const dataset = createDataset({ folderCount: TRAVERSER_PERF_FOLDERS, fileCount: TRAVERSER_PERF_FILES, mode });
  const afterGenerate = snapshot('after generate');

  console.log(`Generating ${mode} dataset for files: ${TRAVERSER_PERF_FILES} folders: ${TRAVERSER_PERF_FOLDERS}`);
  console.table([beforeGenerate, afterGenerate]);

  await runBenchmark(`${mode} result`, dataset);
}
