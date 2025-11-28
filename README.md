# Internxt Drive Desktop for Linux

[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/drive-desktop-linux)

## Installation

Internxt Drive is available for Linux in two formats:

### .deb Package (Recommended)

Download and install the `.deb` package for full compatibility:

```bash
sudo dpkg -i internxt_2.5.1_amd64.deb
```

### AppImage

Alternatively, you can use the AppImage format:

```bash
chmod +x Internxt-2.5.1.AppImage
./Internxt-2.5.1.AppImage
```

#### ⚠️ Important Note about AppImage and SSO Login:

Due to technical limitations of the AppImage format, the new SSO login flow is only supported when using Chrome. The .deb version does not have this restriction and remains fully compatible with all browsers.

For the best experience with SSO authentication, we recommend using the .deb package installation method.

## Development

### Prerequisites

- [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager)
- Node.js 18

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

## Login Configuration Using Deeplink

To log in via deeplink in development mode, special configuration is required due to limitations in Electron 19.

### Create Entry-Point Script

Create a script in the root of the project named `enable-sso.sh` and add the following content:

```
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
# Load nvm manually
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/your-project-path/drive-desktop-linux"
nvm use 18
npm run start:main "$@"
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