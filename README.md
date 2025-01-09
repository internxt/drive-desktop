# Windows Application Setup

This guide explains how to set up and build the Windows application, including both the `node-win` and `drive-desktop` projects.

---

## Prerequisites

Before proceeding, ensure you have the following tools installed:

```markdown
- Python (configured correctly).
- Node.js and yarn.
- node-gyp (global installation):
  npm install -g node-gyp
```

- **Visual Studio** (not VS Code) for building native dependencies.

---

## Directory Structure

Clone the repositories into the following directory structure:

```
internxt
   | - node-win
   | - drive-desktop
```

---

## Build Steps

### **1. Build the `node-win` Project**

1. Open a terminal and navigate to the `node-win` directory.
2. Run the following command to build the project:
   ```bash
   yarn build
   ```
   This step compiles the necessary native bindings for `node-win`.

---

### **2. Build the `drive-desktop` Project**

1. Open a terminal and navigate to the `drive-desktop` directory.
2. Run the following command to build and start the project:
   ```bash
   yarn start:reload-bindings
   ```
   This will start the desktop application with the updated bindings.

---

## Notes

- Ensure all dependencies are installed before running the build commands.
- If you encounter any issues, verify that your environment matches the prerequisites above.

With these steps, your Windows application setup will be complete and ready to use.
