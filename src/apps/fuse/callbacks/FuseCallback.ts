import { Either, right, left } from '../../../context/shared/domain/Either';
import { Stopwatch } from '../../shared/types/Stopwatch';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';
import { PathsToIgnore } from './PathsToIgnore';
import { FuseCodes } from './FuseCodes';

export type Callback = (code: number) => void;

export type CallbackWithData<T> = (code: number, params?: T) => void;

type DebugOptions = {
  input: boolean;
  result: boolean;
  elapsedTime: boolean;
};

export abstract class FuseCallback<T> {
  protected static readonly OK = 0;

  constructor(
    private readonly name: string,
    private readonly debug: Partial<DebugOptions> = {
      input: false,
      result: false,
      elapsedTime: false,
    }
  ) {}

  private logTime(fun: () => Promise<Either<FuseError, T>>) {
    const stopwatch = new Stopwatch();
    stopwatch.start();

    const result = fun();

    Logger.debug(`Elapsed time for ${this.name}: `, stopwatch.elapsedTime());

    return result;
  }

  protected right(value: T): Either<FuseError, T> {
    if (this.debug.result) {
      Logger.debug(`${this.name} Result: ${JSON.stringify({ value })}`);
    }

    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T> {
    Logger.error(`${this.name} Error: ${error.message}.`, error.description);
    return left(error);
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<T>;

    if (PathsToIgnore.includes(params[0])) {
      return callback(FuseCodes.EINVAL);
    }

    if (this.debug.input) {
      Logger.debug(`${this.name}: `, ...params);
    }

    const result = await (this.debug.elapsedTime
      ? this.logTime(() => this.execute(...params))
      : this.execute(...params));

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

    const result = await this.execute(...params);

    if (result.isLeft()) {
      const error = result.getLeft();
      return callback(error.code);
    }

    callback(NotifyFuseCallback.OK);
  }
}
