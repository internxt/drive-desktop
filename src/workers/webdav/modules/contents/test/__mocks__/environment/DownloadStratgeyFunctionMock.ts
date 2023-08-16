import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import { Readable } from 'stream';

type DownloadCallbacks = {
  progressCallback: (progress: number) => void;
  finishedCallback: (err: Error, stream: Readable) => void;
};

export function createDownloadStrategy(fn: (opts: DownloadCallbacks) => void) {
  return (bucket: string, fileId: string, opts: any, strategyObj: any) => {
    fn(opts);

    return new ActionState(ActionTypes.Download);
  };
}
