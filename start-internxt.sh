#!/bin/bash
export NVM_DIR="$HOME/.nvm"
# Carga nvm manualmente
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/home/dev/development/drive-desktop-linux"
nvm use 18
yarn start:main "$@"
