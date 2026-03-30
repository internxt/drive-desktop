import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Environment } from '@internxt/inxt-js';
import { createReadStream } from 'node:fs';
import { parentPort } from 'node:worker_threads';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { AbortRequest, UploadRequest, WorkerRequest, WorkerResponse } from './worker-defs';

function sendResponse(r: WorkerResponse) {
  parentPort?.postMessage(r);
}

parentPort?.on('message', async (r: WorkerRequest) => {
  switch (r.type) {
    case 'upload':
      await onUpload(r);
      break;
    case 'abort':
      onAbort(r);
      break;
  }
});

const aborts = new Map<AbsolutePath, AbortController>();
const serverErrors = ['Server unavailable', 'Incomplete HTTP response', 'Premature close'];

async function onUpload({ path, size, ...r }: UploadRequest) {
  const abortController = new AbortController();
  aborts.set(path, abortController);

  const environment = new Environment(r.config);
  const readable = createReadStream(path);

  try {
    const contentsId = await environment.upload(r.bucketId, {
      abortSignal: abortController.signal,
      fileSize: size,
      source: readable,
      progressCallback: (progress) => sendResponse({ type: 'progress', path, progress }),
    });

    sendResponse({ type: 'success', path, contentsId: contentsId as ContentsId });
  } catch (error) {
    processError(path, error);
  }

  readable.close();
  aborts.delete(path);
}

function onAbort({ path }: AbortRequest) {
  const abort = aborts.get(path);
  if (!abort) {
    sendResponse({ type: 'error', path, code: 'UNKNOWN', error: 'Cannot find abort controller in map' });
    return;
  }
  abort.abort();
  aborts.delete(path);
  sendResponse({ type: 'error', path, code: 'ABORTED' });
}

function processError(path: AbsolutePath, error: unknown) {
  if (!(error instanceof Error)) {
    sendResponse({ type: 'error', path, code: 'UNKNOWN', error });
    return;
  }

  if (error.message === 'Max space used') {
    sendResponse({ type: 'error', path, code: 'MAX_SPACE_USED', error: error.message });
  } else if (serverErrors.includes(error.message)) {
    sendResponse({ type: 'error', path, code: 'SERVER', error: error.message });
  } else {
    sendResponse({ type: 'error', path, code: 'UNKNOWN', error: error.message });
  }
}
