import { ENV } from '../../src/core/env/env';
import chalk from 'chalk';

export default function checkNodeEnv(expectedEnv: 'development' | 'production') {
  if (!expectedEnv) {
    throw new Error('"expectedEnv" not set');
  }

  if (ENV.NODE_ENV !== expectedEnv) {
    console.log(chalk.whiteBright.bgRed.bold(`"process.env.NODE_ENV" must be "${expectedEnv}" to use this webpack config`));
    process.exit(2);
  }
}
