export class MapObserver {
  constructor(
    private readonly mapToObserve: Map<any, any>,
    private readonly callback: () => void,
    private intervalId: NodeJS.Timeout | null = null
  ) {}

  startObserving() {
    if (this.intervalId === null) {
      this.intervalId = setInterval(() => {
        if (this.mapToObserve.size === 0) {
          clearInterval(this.intervalId!);
          this.intervalId = null;
          this.callback();
        }
      }, 1_000);
    }
  }

  stopObserving() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
