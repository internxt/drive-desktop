class Right<L, R> {
  constructor(_: L, private _value: R) {}

  getRight = (): R => this._value;

  getLeft = (): L => null as unknown as L;

  isRight(): boolean {
    return true;
  }

  isLeft = (): boolean => {
    return false;
  };

  fold<T>(_: (_: L) => T | void | void, rightFn: (_: R) => T): T | void {
    return rightFn(this._value);
  }
}

class Left<L, R> {
  constructor(private _value: L, _: R) {}

  getLeft = (): L => this._value;

  getRight = (): R => null as unknown as R;

  isRight = (): boolean => {
    return false;
  };

  isLeft = (): boolean => {
    return true;
  };

  fold<T>(leftFn: (_: L) => T | void, _: (_: R) => T): T | void {
    return leftFn(this._value);
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const right = <L, R>(value: R) =>
  new Right<L, R>(null as unknown as L, value);

export const left = <L, R>(value: L) =>
  new Left<L, R>(value, null as unknown as R);
