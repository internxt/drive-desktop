/**
 * Linux's /proc/PID/comm truncates process names to 15 characters.
 * The names below are the known thumbnailer process names after that truncation.
 *
 * Examples of full → truncated names:
 *   pool-org.gnome.N… → pool-org.gnome.  (GNOME/Nautilus thumbnailer thread pool)
 *   gnome-thumbnail-factory → gnome-thumbnail
 *   evince-thumbnailer      → evince-thumbnai
 *   totem-video-thumbnailer → totem-video-thu
 *   ffmpegthumbnailer       → ffmpegthumbnaile
 *   tumbler-1               → tumbler-1
 */
const THUMBNAIL_PROCESS_NAMES = new Set([
  'pool-org.gnome.', // GNOME/Nautilus thumbnailer thread pool (pool-org.gnome.NautilusThumbnailFactory, etc.)
  'gnome-thumbnail', // gnome-thumbnail-factory (GNOME Files)
  'evince-thumbnai', // evince-thumbnailer (Evince document viewer)
  'totem-video-thu', // totem-video-thumbnailer (Totem video)
  'ffmpegthumbnaile', // ffmpegthumbnailer
  'tumbler-1', // xfce tumbler
]);

export function isThumbnailProcess(processName: string): boolean {
  return THUMBNAIL_PROCESS_NAMES.has(processName);
}
