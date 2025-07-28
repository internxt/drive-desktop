[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/drive-desktop)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=coverage)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)

# Setup

This guide explains how to set up and build the `drive-desktop` project.

## Prerequisites

Before proceeding, ensure you have the following tools installed:

- **NVM**

https://github.com/coreybutler/nvm-windows


- **Node.js 20**

```bash
nvm install 20
```

- **node-gyp**
```bash
npm install -g node-gyp
```

- **Python 3.10**

Install using win store

- **Visual Studio** (not VS Code) for building native dependencies.

![alt text](public/image.png)

![alt text](public/image-1.png)

## Build Steps

```bash
npm run init:dev
npm run start
```

# How to publish a release

## Step 1: Update clamAV database

```bash
cd clamAV
.\freshclam.exe
```

## Step 2: Generate the build

```bash
npm run package
```

This will generate an unsigned build and the following files inside `build`:

- `Internxt Drive Setup 2.3.5.exe`
- `Internxt Drive Setup 2.3.5.exe.blockmap`
- `latest.yml`

## Step 3: Sign the `.exe` file

### Download and install DigiCert​​®​​ KeyLocker

1. The `Keylockertools-windows-x64.msi` file can be requested from Fran or Sergio.
2. Install it.

### Set environment variables

Add the following environment variables to the `.env` file:

- `SM_API_KEY`
- `SM_CLIENT_CERT_PASSWORD`

### Save the `.p12` certificate

Save the `.p12` inside the `sign` folder as `certificate.p12`.

### Install SignTool

[SignTool.exe](https://docs.digicert.com/en/software-trust-manager/client-tools/signing-tools/third-party-signing-tool-integrations/signtool.html#download-signtool-480768)

```bash
# Powershell 7
cd sign
.\smctl.exe healthcheck
# You should see
# --------- Signing tools ---------
# Signtool:
#        Mapped: Yes
#        Path: C:\Program Files (x86)\Windows Kits\10\bin\version\x64\signtool.exe
```

### Execute the script

```bash
# Powershell 7
cd sign
./sign.ps1
```

## Step 4: Upload the files to the release

- The **signed `.exe` file**.
- The **`.blockmap` file**.
- The **updated `latest.yml` file** with the new hash.
