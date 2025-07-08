import { Either } from './Either';

export const fold = <L, R, T>(
  either: Either<L, R>,
  onLeft: (error: L) => T,
  onRight: (value: R) => T
): T =>
  either.isLeft() ? onLeft(either.getLeft()) : onRight(either.getRight());
