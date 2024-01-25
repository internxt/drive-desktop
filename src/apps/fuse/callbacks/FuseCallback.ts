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
  output: boolean;
  elapsedTime: boolean;
};

export abstract class FuseCallback<T> {
  protected static readonly OK = 0;

  constructor(
    protected readonly name: string,
    protected readonly debug: Partial<DebugOptions> = {
      input: false,
      output: false,
      elapsedTime: false,
    }
  ) {}

  private async logTime(fun: () => Promise<Either<FuseError, T>>) {
    const stopwatch = new Stopwatch();
    stopwatch.start();

    const result = await fun();

    if (this.debug.elapsedTime) {
      Logger.debug(`Elapsed time for ${this.name}: `, stopwatch.elapsedTime());
    }

    return result;
  }

  protected right(value: T): Either<FuseError, T> {
    if (this.debug.output) {
      Logger.debug(
        `${this.name} Result: ${JSON.stringify({ value }, null, 2)}`
      );
    }

    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T> {
    Logger.error(`${this.name} Error: ${error.message}.`, error.description);
    return left(error);
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<T>;

    if (PathsToIgnore.some((regex) => regex.test(params[0]))) {
      return callback(FuseCodes.EINVAL);
    }

    if (this.debug.input) {
      Logger.debug(`${this.name}: `, ...params);
    }

    const result = await this.logTime(() => this.execute(...params));

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
    if (this.debug.output) {
      Logger.debug(`${this.name} completed successfully`);
    }

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
