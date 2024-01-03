import { Either, right, left } from '../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';

export type Callback = (code: number) => void;

export type CallbackWithData<T> = (code: number, params?: T) => void;

export abstract class FuseCallback<T> {
  protected static readonly OK = 0;

  protected right(value: T): Either<FuseError, T> {
    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T> {
    Logger.error('[FUSE CALLBACK ERROR] ', error.message, error.description);
    return left(error);
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<T>;

    const result = await this.execute(params);

    if (result.isLeft()) {
      const error = result.getLeft();
      return callback(error.code);
    }

    const data = result.getRight();

    callback(FuseCallback.OK, data);
  }

  abstract execute(...params: any[]): Promise<Either<FuseError, T>>;
}

export abstract class NotifyFuseCallback extends FuseCallback<undefined> {
  protected right(): Either<FuseError, undefined> {
    return right(undefined);
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as Callback;

    const result = await this.execute(params);

    if (result.isLeft()) {
      const error = result.getLeft();
      return callback(error.code);
    }

    callback(NotifyFuseCallback.OK);
  }
}
