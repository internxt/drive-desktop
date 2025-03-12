declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CRYPTO_KEY: string;
      platform: string;
      NODE_ENV: 'none' | 'development' | 'production';
      SENTRY_DSN: string;
    }
  }
}

export {};
