import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import {
  UploadOptions,
  UploadStrategyFunction,
} from '@internxt/inxt-js/build/lib/core';

export function createUploadStrategy(
  fn: (opts: UploadOptions) => void
): UploadStrategyFunction {
  return (bucketId: string, opts: UploadOptions) => {
    fn(opts);

    return new ActionState(ActionTypes.Upload);
  };
}
