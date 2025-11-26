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
yarn install
```

### Starting Development

Start the app in the `dev` environment:

```bash
yarn start
```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```
