import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import { Readable } from 'stream';

type DownloadCallbacks = {
  progressCallback: (progress: number) => void;
  finishedCallback: (err: Error, stream: Readable) => void;
};

export function createDownloadStrategy(fn: (opts: DownloadCallbacks) => void) {
  return (_bucket: string, _fileId: string, opts: DownloadCallbacks) => {
    fn(opts);

    return new ActionState(ActionTypes.Download);
  };
}
