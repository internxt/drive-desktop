import fs from 'fs';
import { execSync } from 'child_process';
import { dependencies } from '../../package.json';

const dependenciesKeys = Object.keys(dependencies);
const nativeDeps = fs
  .readdirSync('node_modules')
  .filter((folder) => fs.existsSync(`node_modules/${folder}/binding.gyp`))
  .filter((folder) => folder !== 'virtual-drive');

const { dependencies: dependenciesObject } = JSON.parse(execSync(`npm ls ${nativeDeps.join(' ')} --json`).toString());
const rootDependencies = Object.keys(dependenciesObject);
const filteredRootDependencies = rootDependencies.filter((rootDependency) => dependenciesKeys.includes(rootDependency));
console.log('Native dependencies:', filteredRootDependencies.concat('virtual-drive'));
