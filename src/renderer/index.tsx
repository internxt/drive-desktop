import { render } from 'react-dom';
import App from './App';
import { init } from '@sentry/electron/renderer';
import { init as reactInit } from '@sentry/react';

// Initialize Sentry for the Renderer process
// eslint-disable-next-line no-console
console.info('Initializing Sentry for renderer process');
if (process.env.SENTRY_DSN) {
  init(
    {
      dsn: process.env.SENTRY_DSN,
      debug: true,
    },
    reactInit
  );
  // eslint-disable-next-line no-console
  console.info('Sentry is ready for renderer process');
} else {
  // eslint-disable-next-line no-console
  console.error(
    'Sentry DSN not found, cannot initialize Sentry in renderer process'
  );
}

render(<App />, document.getElementById('root'));
