declare interface Window {
  electron: {
    pathChanged(path: string): void;

    userIsUnauthorized(): void;

    userLoggedIn(
      data: import('../renderer/pages/Login/service').AccessResponse
    ): void;

    isUserLoggedIn(): Promise<boolean>;

    onUserLoggedInChanged(func: (value: boolean) => void): void;

    logout(): void;

    closeWindow(): void;

    openSyncFolder(): Promise<void>;

    quit(): void;

    getUser(): Promise<import('./types').User>;

    getHeaders(): Promise<ReturnType<typeof import('./auth').getHeaders>>;

    env: typeof process.env;
  };
}
