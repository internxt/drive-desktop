import { Either, right, left } from '../../../../context/shared/domain/Either';
import { Stopwatch } from '../../../shared/types/Stopwatch';
import { FuseError, FuseUnknownError } from './FuseErrors';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { PathsToIgnore } from './PathsToIgnore';
import { FuseCodes } from './FuseCodes';

export type Callback = (code: number) => void;

export type CallbackWithData<T> = (code: number, params?: T) => void;

type DebugOptions = {
  input: boolean;
  output: boolean;
  debug: boolean;
  elapsedTime: boolean;
  detectSlowCallbacks: boolean;
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
      detectSlowCallbacks: true,
    }
  ) {}

  protected async executeAndCatch(
    params: any[]
  ): Promise<Either<FuseError, T>> {
    // Ensure that an Either is always returned

    const stopwatch = new Stopwatch();
    let interval: NodeJS.Timeout | undefined = undefined;

    if (this.debug.detectSlowCallbacks) {
      interval = setInterval(() => {
        const et = stopwatch.elapsedTime();

        if (et > 10) {
          logger.debug({ msg: `${this.name} ${params} is running for ${et}ms` });
        }
      }, 2_000);
    }

    try {
      stopwatch.start();

      const result = await this.execute(...params);

      return result;
    } catch (throwed: unknown) {
      logger.error({ msg: 'Error in FUSE callback', error: throwed });
      if (throwed instanceof FuseError) {
        return this.left(throwed);
      }

      return this.left(new FuseUnknownError());
    } finally {
      if (this.debug.elapsedTime) {
        logger.debug({
          msg: `Elapsed time for ${this.name}: ${params[0]}`,
          elapsedTime: stopwatch.elapsedTime()
        });
      }

      if (interval) {
        clearInterval(interval);
      }
    }
  }

  protected right(value: T): Either<FuseError, T> {
    if (this.debug.output) {
      logger.debug({
        msg: `${this.name} Result: ${JSON.stringify({ value }, null, 2)}`
      });
    }

    return right(value);
  }

  protected left(error: FuseError): Either<FuseError, T>;
  protected left(error: unknown): Either<FuseError, T>;

  protected left(error: FuseError | unknown): Either<FuseError, T> {
    if (error instanceof FuseError) {
      logger.error({ msg: `${this.name}`, error });
      return left(error);
    }

    logger.error({ msg: `${this.name} Error:`, error });
    return left(new FuseUnknownError());
  }

  protected logDebugMessage(...message: Array<string>): void {
    if (!this.debug) return;

    logger.debug({ msg: `${this.name}: `, message });
  }

  async handle(...params: any[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<T>;

    if (PathsToIgnore.some((regex) => regex.test(params[0]))) {
      return callback(FuseCodes.EINVAL);
    }

    if (this.debug.input) {
      logger.debug({ msg: `${this.name}: `, params });
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
      logger.debug({ msg: `${this.name}: `, params });
    }

    const result = await this.executeAndCatch(params);

    if (result.isLeft()) {
      const error = result.getLeft();

      if (this.debug.output) {
        logger.debug({ msg: `${this.name}`, error });
      }

      return callback(error.code);
    }

    if (this.debug.output) {
      logger.debug({ msg: `${this.name} completed successfully ${params[0]}` });
    }

    callback(NotifyFuseCallback.OK);
  }
}
