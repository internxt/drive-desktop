# Internxt Drive Desktop for Linux

[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/drive-desktop-linux)

## Compatibility

As of right now, Internxt Drive Desktop for Linux is only compatible with Ubuntu and Debian with the File explorer **Nautilus** (The default file explorer for Gnome).

We cannot guarantee that the app will work properly on other Linux distributions or with other file explorers as our development and testing efforts are focused on ensuring the best experience for Ubuntu and Debian users.

## Installation

Internxt Drive is available for Linux in two formats:

### .deb Package (Recommended)

Download and install the `.deb` package for full compatibility:

```bash
sudo dpkg -i internxt_2.6.0_amd64.deb
```

### AppImage

Alternatively, you can use the AppImage format:

```bash
chmod +x Internxt-2.6.0.AppImage
./Internxt-2.6.0.AppImage
```

#### ⚠️ Important Note about AppImage and SSO Login:

Due to technical limitations of the AppImage format, the new SSO login flow is only supported when using Chrome. The .deb version does not have this restriction and remains fully compatible with all browsers.

For the best experience with SSO authentication, we recommend using the .deb package installation method.

## Development

### Prerequisites

- [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager)
- Node.js 20

If working on the FUSE daemon (Go), see [packages/fuse-daemon/README.md](packages/fuse-daemon/README.md) for Go and linting tool prerequisites.

### Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/internxt/drive-desktop-linux.git
cd drive-desktop-linux
npm install
```

### Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

Building the `.rpm` package requires `rpmbuild`. On Ubuntu or Debian, install the `rpm` package before running the packaging command:

```bash
sudo apt-get install rpm
```

### Official Release Build (CI Container)

The official release pipeline builds and publishes artifacts inside a pinned container image (`Dockerfile.release`) to reduce host drift.

Current release flow:

1. Build container image from `ubuntu:24.04`.
2. Run `npm ci` and `npm run publish` inside the container.
3. Upload generated artifacts (`.deb`, `.rpm`, `.AppImage`) plus build metadata.
4. Run smoke tests on the generated `.deb` without rebuilding it.

### Smoke Test Strategy

The release workflow includes a smoke test job that:

1. Downloads the previously built `.deb` artifact.
2. Installs runtime dependencies for Linux GUI startup checks.
3. Installs the package and verifies `/opt/Internxt/internxt` exists.
4. Launches the binary in headless mode (`xvfb-run`) and checks startup.

## Login Configuration Using Deeplink

Create a script in the root of the project named `enable-sso.sh` and add the following content:

```
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
# Load nvm manually
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/your-project-path/drive-desktop-linux/"
nvm use 20
npm run start:main -- "$@"
```

Use the following command to give the script execution permissions:

`chmod +x /your-project-location/drive-desktop-linux/enable-sso.sh`

### Create Linux Handler Protocol File

Use the following command to create the file and add the following content:

` vim ~/.local/share/applications/internxt-protocol.desktop`

```
[Desktop Entry]
Type=Application
Name=Internxt Desktop (Dev)
Exec=/your-project-location/drive-desktop-linux/enable-sso.sh %u
Icon=internxt
Terminal=false
MimeType=x-scheme-handler/internxt;
```

Change the permissions of the newly created file:

`chmod 644 ~/.local/share/applications/internxt-protocol.desktop`

Register the internxt protocol handler:

`xdg-mime default internxt-protocol.desktop x-scheme-handler/internxt`

Update the application database:

`update-desktop-database ~/.local/share/applications`

Check that the internxt protocol is correctly registered:

`gio mime x-scheme-handler/internxt`

Verify by logging into the application.

### Troubleshooting SSO in Development

If opening an `internxt://` URL launches the development command but Electron exits with an error like this:

```
The SUID sandbox helper binary was found, but is not configured correctly.
You need to make sure that node_modules/electron/dist/chrome-sandbox is owned by root and has mode 4755.
```

Or the dev app does not open at all, it may be that the deeplink registration is working, but Electron is aborting before the main process starts because Chromium's Linux sandbox helper has the wrong owner or permissions.

Confirm the current permissions (in the project root):

```bash
ls -l node_modules/electron/dist/chrome-sandbox
```

Fix them from the project root:

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

The expected result is that `chrome-sandbox` is owned by `root` and has the setuid bit enabled:

```bash
-rwsr-xr-x 1 root root ... node_modules/electron/dist/chrome-sandbox
```

This may need to be repeated after reinstalling dependencies, because `node_modules/electron` can be recreated with regular user ownership.
