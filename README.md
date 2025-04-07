# Setup

This guide explains how to set up and build the `drive-desktop` project.

## Prerequisites

Before proceeding, ensure you have the following tools installed:

- **Node.js 18**

```bash
nvm install 18
```

- **pnpm**

```bash
npm install -g pnpm
```

- **Visual Studio** (not VS Code) for building native dependencies.

## Build Steps

```bash
npm run init:dev
npm run start
```

This will start the desktop application with the updated bindings.

# How to Manually Sign and Effectively Publish a Release

**IMPORTANT: READ THE ENTIRE PROCESS CAREFULLY BEFORE PROCEEDING.**

If you plan to manually sign a build for publication, follow these steps:

## Step 1: Generate the Build

Run the command:

```bash
npm run package
```

This will generate an unsigned build and the following files:

- `Internxt Drive Setup 2.3.5.exe`
- `Internxt Drive Setup 2.3.5.exe.blockmap`
- `latest.yml`

## Step 2: Sign the `.exe` File

You need to sign the `.exe` file using either DigiCert tools or the `smctl` CLI.

### Requirements:

- **The `.p12` certificate**
- **The `.p12` password**
- **The API key**

Follow the setup instructions in this guide: [smctl Setup Guide](https://docs.digicert.com/en/digicert-keylocker/client-tools/signing-tools/smctl.html).

### Key Steps:

1. Download and install **smctl** or **DigiCert​​®​​ KeyLocker**.

   - The MSI file can be requested from Fran, Sergio, or Jonathan.

2. If the DigiCert application does not open, navigate to: `C:\Program Files\DigiCert\Click to Sign`

3. Open the **Click to Sign** application to configure the required environment variables.

### Signing the Application:

Once configured, right-click on the `.exe` file: `Show More Options -> DigiCert@ -> Sign Now`.

This will sign the application.

---

## Step 3: Validate the SHA512 Hash

**IMPORTANT:** Signing the application will modify its SHA512 hash.

### Why Updating the Hash in `latest.yml` is Important?

The `latest.yml` file is critical for the auto-updater to function properly. It contains metadata about the latest release, including the SHA512 hash of the installer file. This hash ensures the integrity and authenticity of the application during the update process.

When the auto-updater checks for updates, it compares the file's hash with the one provided in `latest.yml`. If they don't match, the update will fail or could raise security concerns, as it may indicate that the file has been tampered with.

**Key Points:**

1. **Integrity Verification:** The SHA512 hash guarantees the installer hasn't been altered after signing.
2. **Update Success:** Without an updated hash, the auto-updater cannot validate or complete the update process.
3. **Security Assurance:** Prevents unauthorized or corrupted files from being installed on user systems.

---

## How the Auto-Updater Works

The auto-updater in the application operates as follows:

1. **Checks for Updates:**
   - The application queries the server to fetch the `latest.yml` file, which contains metadata about the latest version.
2. **Compares Versions:**
   - The current version installed on the user’s system is compared with the version specified in `latest.yml`.
3. **Validates File Integrity:**
   - The installer file's SHA512 hash is validated against the hash in `latest.yml` to ensure the file is authentic and unaltered.
4. **Downloads and Updates:**
   - If an update is available, the application downloads the new installer file and begins the update process seamlessly.
5. **Installs Update:**
   - The update is applied, and the application restarts with the new version.

---

To validate the new hash, use the following command:

```bash
CertUtil -hashfile ".\Internxt Drive Setup 2.3.5.exe" SHA512
```

This will output the new hash. You can compare the hash before and after signing to confirm the modification.

---

## Step 4: Update the `latest.yml` File

The `latest.yml` file contains the SHA512 hash in Base64 format. Here’s an example of the `latest.yml` file structure:

```yaml
version: 2.3.5
files:
  - url: Internxt-Drive-Setup-2.3.5.exe
    sha512: 19rbiabrWiNcfIC2l71wuP+boKwCnEFnxbnMry7ymJcOvOosRNqvUB5o3VMeAhubsxV3qdSOOP6mSNpjo9xGCQ==
    size: 139542246
path: Internxt-Drive-Setup-2.3.5.exe
sha512: 19rbiabrWiNcfIC2l71wuP+boKwCnEFnxbnMry7ymJcOvOosRNqvUB5o3VMeAhubsxV3qdSOOP6mSNpjo9xGCQ==
releaseDate: '2025-01-23T15:42:56.531Z'
```

1. **Convert the SHA512 hash to Base64:** Use the script located at: `.erb\scripts\convert-hash.py`.

2. **Update the `sha512` field in `latest.yml`** with the new Base64 hash value.

---

## Step 5: Upload the Files to the Release

Finally, upload the following files to the release:

- The **signed `.exe` file**.
- The **`.blockmap` file**.
- The **updated `latest.yml` file** with the new hash.

---

By following these steps, you ensure that your release is signed, validated, and ready for publication.
