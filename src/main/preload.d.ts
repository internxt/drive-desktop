declare interface Window {
  electron: {
    pathChanged(path: string): void;

    userIsUnauthorized(): void;
  };
}
