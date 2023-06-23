import { performance } from 'perf_hooks';

export class Stopwatch {
  private _start: number | undefined;
  private _finish: number | undefined;

  start() {
    if (this._start) {
      this._finish = undefined;
    }

    this._start = performance.now();
  }

  finish() {
    if (!this._start) {
      throw new Error('Cannot finish a stopwatch that have not started');
    }
    this._finish = performance.now();
  }

  elapsedTime(): number | undefined {
    if (!this._start || !this._finish) {
      return undefined;
    }

    return this._start - this._finish;
  }

  reset() {
    this._start = this._finish = undefined;
  }
}
