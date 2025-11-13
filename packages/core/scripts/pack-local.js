const { execSync } = require('child_process');
const fs = require('fs');

execSync('npm pack --pack-destination=.', { stdio: 'inherit' });

const files = fs.readdirSync('.');
const tarball = files.find((f) => f.startsWith('internxt-drive-desktop-core-') && f.endsWith('.tgz'));

if (tarball) {
  fs.renameSync(tarball, 'core.tgz');
  console.log(`Renamed ${tarball} to core.tgz`);
}
