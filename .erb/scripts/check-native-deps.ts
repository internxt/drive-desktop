import fs from 'fs';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { nativeDeps } from '../configs/webpack.paths';

const realNativeDeps = fs.readdirSync('node_modules').filter((folder) => fs.existsSync(`node_modules/${folder}/binding.gyp`));
const { dependencies: dependenciesObject } = JSON.parse(execSync(`npm ls ${realNativeDeps.join(' ')} --json`).toString());
const rootDependencies = Object.keys(dependenciesObject);
const filteredRootDependencies = rootDependencies.filter((rootDependency) => realNativeDeps.includes(rootDependency));

if (JSON.stringify(filteredRootDependencies) !== JSON.stringify(nativeDeps)) {
  console.log(chalk.whiteBright.bgGreen.bold('Make sure you have these depedencies listed in your nativeDeps'));
  console.log(filteredRootDependencies);
  process.exit(1);
}
