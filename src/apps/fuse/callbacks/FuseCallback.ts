import { Either, right, left } from '../../../context/shared/domain/Either';
import { Stopwatch } from '../../shared/types/Stopwatch';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';

export type Callback = (code: number) => void;

export type CallbackWithData<T> = (code: number, params?: T) => void;

export abstract class FuseCallback<T> {
  protected static readonly OK = 0;

  constructor(private readonly name: string, private readonly debug = false) {}

  protected right(value: T): Either<FuseError, T> {
    if (this.debug) {
      Logger.debug(`${this.name} Result: ${value}`);
    }

    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T> {
    Logger.error(`${this.name} Error: ${error.message}.`, error.description);
    return left(error);
  }

  async handle(...params: any[]): Promise<void> {
    const stopwatch = new Stopwatch();
    stopwatch.start();

    const callback = params.pop() as CallbackWithData<T>;
    // Logger.info(`${this.name}: `, ...params);

    const result = await this.execute(...params);

    if (result.isLeft()) {
      const error = result.getLeft();
      return callback(error.code);
    }

    const data = result.getRight();

    // Logger.info(`Elapsed time for ${this.name}: `, stopwatch.elapsedTime());

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

    const result = await this.execute(...params);

    if (result.isLeft()) {
      const error = result.getLeft();
      return callback(error.code);
    }

    callback(NotifyFuseCallback.OK);
  }
}
