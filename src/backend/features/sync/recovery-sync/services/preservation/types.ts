import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { RecoveryMove } from '../../types';

export type PreservationAdapters = {
  /** Verifies complete contents and expected local identity; retries inspect the exclusive destination before moving again. */
  preserveContents: (props: { move: RecoveryMove }) => Promise<Result<{ preservedFileCount: number }>>;
  /** Serializes this source with sync, watchers and placeholder operations; success requires related events to settle. */
  withMoveGuard: <T>(props: { move: RecoveryMove; action: () => Promise<Result<T>> }) => Promise<Result<T>>;
};
