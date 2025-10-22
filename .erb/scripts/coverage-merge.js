const { execSync } = require('child_process');
const { mkdirSync } = require('fs');

const coverageDirectories = ['./coverage/unit', './coverage/helper', './coverage/infra'];

mkdirSync('./coverage/merged');
execSync(`npx nyc merge ${coverageDirectories.join(' ')} ./coverage/merged/coverage.json`, { stdio: 'inherit' });
execSync('npx nyc report --reporter=lcov --report-dir=./coverage/merged --temp-dir=./coverage/merged', { stdio: 'inherit' });
