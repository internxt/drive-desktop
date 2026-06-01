/**
 * Processes known to trigger file reads for system purposes (thumbnail generation,
 * directory browsing) rather than user-initiated file opens.
 *
 * Matched with startsWith to handle kernel's 16-char /proc/<pid>/comm truncation
 * and version-suffixed variants.
 *
 * To expand compatibility for a new file manager, add its thumbnail daemon here.
 *
 * WARNING: Never block the broad `pool-` prefix — GNOME user apps (e.g. Text Editor
 * as `pool-gnome-text`, VLC as `vlc`) use different pool names and must be allowed through.
 * Only add specific known thumbnail/system daemon prefixes.
 */
const BLOCKLISTED_PROCESS_PREFIXES = [
  'pool-org.gnome', // GNOME thread pool — Nautilus thumbnail generation
  'gdk-pixbuf-thum', // GDK pixbuf thumbnailer (truncated at 15 chars by kernel)
  //'EogJobScheduler', // Eye of GNOME (image viewer) background job scheduler
  // 'tumblerd', // Thunar, Caja, PCManFM thumbnail daemon (freedesktop spec)
  // 'kio_thumbnail', // Dolphin KIO thumbnail worker
  // 'thumbnail.so', // Dolphin KIO thumbnail worker (alternative name)
];

export function isBlocklistedProcess(processName: string): boolean {
  return BLOCKLISTED_PROCESS_PREFIXES.some((prefix) => processName.startsWith(prefix));
}
