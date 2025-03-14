declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CRYPTO_KEY: string;
      NODE_ENV: 'development' | 'production';
      SENTRY_DSN: string;
    }
  }
}

export {};
