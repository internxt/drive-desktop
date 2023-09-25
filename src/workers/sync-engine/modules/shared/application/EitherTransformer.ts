import { Either, left, right } from '../domain/Either';

export class EitherTransformer {
  static handleWithEither<T>(fn: () => T): Either<Error, T> {
    try {
      const result = fn();
      return right(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return left(error);
      }
      return left(new Error('unkown error'));
    }
  }
}
