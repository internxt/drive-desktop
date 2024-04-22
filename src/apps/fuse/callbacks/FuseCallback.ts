import { Either, right, left } from '../../../context/shared/domain/Either';
import { Stopwatch } from '../../shared/types/Stopwatch';
import { FuseError, FuseUnknownError } from './FuseErrors';
import Logger from 'electron-log';
import { PathsToIgnore } from './PathsToIgnore';
import { FuseCodes } from './FuseCodes';

export type Callback = (code: number) => void;

export type CallbackWithData<T> = (code: number, params?: T) => void;

type DebugOptions = {
  input: boolean;
  output: boolean;
  debug: boolean;
  elapsedTime: boolean;
};

export abstract class FuseCallback<T> {
  protected static readonly OK = 0;

  constructor(
    protected readonly name: string,
    protected readonly debug: Partial<DebugOptions> = {
      input: false,
      output: false,
      debug: false,
      elapsedTime: false,
    }
  ) {}

  protected async executeAndCatch(
    params: any[]
  ): Promise<Either<FuseError, T>> {
    // Ensure that an Either is always returned

    const stopwatch = new Stopwatch();
    try {
      stopwatch.start();

      const result = await this.execute(...params);

      return result;
    } catch (throwed: unknown) {
      if (throwed instanceof FuseError) {
        return this.left(throwed);
      }

      return this.left(new FuseUnknownError());
    } finally {
      if (this.debug.elapsedTime) {
        Logger.debug(
          `Elapsed time for ${this.name}: `,
          stopwatch.elapsedTime()
        );
      }
    }
  }

  protected right(value: T): Either<FuseError, T> {
    if (this.debug.output) {
      Logger.debug(
        `${this.name} Result: ${JSON.stringify({ value }, null, 2)}`
      );
    }

    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T>;
  protected left(error: unknown): Either<FuseError, T>;

  protected left(error: FuseError | unknown): Either<FuseError, T> {
    if (error instanceof FuseError) {
      Logger.error(`${this.name} ${error}`);
      return left(error);
    }

    Logger.error(`${this.name} Error: Unknown.`);
    return left(new FuseUnknownError());
  }

  protected logDebugMessage(...message: Array<string>): void {
    if (!this.debug) return;

    Logger.debug(`${this.name}: `, ...message);
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<T>;

    if (PathsToIgnore.some((regex) => regex.test(params[0]))) {
      return callback(FuseCodes.EINVAL);
    }

    if (this.debug.input) {
      Logger.debug(`${this.name}: `, ...params);
    }

    const result = await this.executeAndCatch(params);

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

    if (this.debug.input) {
      Logger.debug(`${this.name}: `, ...params);
    }

    const result = await this.executeAndCatch(params);

    if (result.isLeft()) {
      const error = result.getLeft();

      if (this.debug.output) {
        Logger.debug(`${this.name} ${error}`);
      }

      return callback(error.code);
    }

    if (this.debug.output) {
      Logger.debug(`${this.name} completed successfully ${params[0]}`);
    }

    callback(NotifyFuseCallback.OK);
  }
}
