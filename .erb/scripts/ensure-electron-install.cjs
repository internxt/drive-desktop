#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootPath = path.resolve(__dirname, '..', '..');
const electronPath = path.join(rootPath, 'node_modules', 'electron');
const distPath = path.join(electronPath, 'dist');
const pathFile = path.join(electronPath, 'path.txt');

function getPlatformPath() {
  return 'electron';
}

function isElectronInstalled(version, platformPath) {
  try {
    const distVersion = fs.readFileSync(path.join(distPath, 'version'), 'utf8').trim().replace(/^v/, '');
    const executablePath = fs.readFileSync(pathFile, 'utf8').trim();

    if (distVersion !== version || executablePath !== platformPath) {
      return false;
    }
  } catch {
    return false;
  }

  return fs.existsSync(path.join(distPath, platformPath));
}

function ensureElectronInstalled() {
  if (!fs.existsSync(electronPath)) {
    return Promise.resolve();
  }

  const platformPath = getPlatformPath();
  const electronPkg = require(path.join(electronPath, 'package.json'));
  const version = electronPkg.version;

  if (isElectronInstalled(version, platformPath)) {
    return Promise.resolve();
  }

  console.log('[electron] Installing missing Electron binary artifacts...');

  const { downloadArtifact } = require('@electron/get');

  return downloadArtifact({
    version,
    artifactName: 'electron',
    checksums: require(path.join(electronPath, 'checksums.json')),
    platform: process.platform,
    arch: process.arch,
  })
    .then((zipPath) => {
      const unzipResult = spawnSync('unzip', ['-o', zipPath, '-d', distPath], {
        cwd: rootPath,
        env: process.env,
        stdio: 'inherit',
      });

      if (unzipResult.status !== 0) {
        throw new Error(`Failed to extract Electron zip: ${zipPath}`);
      }
    })
    .then(() => {
      const srcTypeDefPath = path.join(distPath, 'electron.d.ts');
      const targetTypeDefPath = path.join(electronPath, 'electron.d.ts');

      if (fs.existsSync(srcTypeDefPath)) {
        fs.renameSync(srcTypeDefPath, targetTypeDefPath);
      }

      fs.writeFileSync(pathFile, platformPath);

      if (!isElectronInstalled(version, platformPath)) {
        throw new Error('Electron repair completed but install validation still failed.');
      }

      console.log('[electron] Electron binary artifacts installed.');
    });
}

Promise.resolve(ensureElectronInstalled()).catch((error) => {
  console.error('[electron] Failed to install Electron:', error);
  process.exit(1);
});