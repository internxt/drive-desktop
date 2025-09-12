/**
 * Check if a file or directory name is related to Internxt
 */
export function isInternxtRelated(name: string): boolean {
  const internxtPatterns = [/internxt/i, /drive-desktop/i];

  return internxtPatterns.some((pattern) => pattern.test(name));
}
