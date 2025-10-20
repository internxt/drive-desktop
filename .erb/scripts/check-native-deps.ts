import fs from 'node:fs';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { nativeDeps } from '../configs/webpack.paths';

const depsWithBindingGyp = fs.readdirSync('node_modules').filter((folder) => fs.existsSync(`node_modules/${folder}/binding.gyp`));
const { dependencies } = JSON.parse(execSync(`npm ls ${depsWithBindingGyp.join(' ')} --json`).toString());
const realNativeDeps = Object.keys(dependencies).concat(['@internxt/node-win']);

if (JSON.stringify(realNativeDeps) !== JSON.stringify(nativeDeps)) {
  console.log(chalk.whiteBright.bgRed.bold('Make sure you have these dependencies listed in your nativeDeps'));
  console.log(realNativeDeps);
  process.exit(1);
} else {
  console.log(chalk.whiteBright.bgGreen.bold('Dependencies listed in your nativeDeps'));
  console.log(realNativeDeps);
}
