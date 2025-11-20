import { readFile, writeFile, mkdir, chmod, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "@internxt/drive-desktop-core/build/backend";

const execAsync = promisify(exec);

const DESKTOP_FILE = join(homedir(), ".local/share/applications/internxt-appimage.desktop");

export async function setupAppImageDeeplink() {
  const appImagePath = process.env.APPIMAGE;
  if (!appImagePath) return;

  await ensureDotDesktopUpdated(appImagePath);
}

async function ensureDotDesktopUpdated(currentPath: string) {
  const previousPath = await extractExecPath();

  if (previousPath !== currentPath) {
    await installDesktopFile(currentPath);
    await registerProtocol();
  }
}

async function extractExecPath() {
  try {
    await access(DESKTOP_FILE);
    const content = await readFile(DESKTOP_FILE, "utf8");
    const execLine = content.split("\n").find(line => line.startsWith("Exec="));

    if (!execLine) return null;

    return execLine.replace("Exec=", "").replace(" %u", "").trim();
  } catch {
    return null;
  }
}

async function installDesktopFile(appImagePath: string) {
  const desktopContent = `[Desktop Entry]
  Name=Internxt
  Exec=${appImagePath} %u
  Terminal=false
  Type=Application
  MimeType=x-scheme-handler/internxt;`;

  await mkdir(dirname(DESKTOP_FILE), { recursive: true });
  await writeFile(DESKTOP_FILE, desktopContent);
  await chmod(DESKTOP_FILE, 0o755);
}

async function registerProtocol() {
  try {
    await execAsync("xdg-mime default internxt-appimage.desktop x-scheme-handler/internxt");
  } catch (err) {
    logger.error({tag: "AUTH", msg: "Failed to register protocol:", err});
  }
}