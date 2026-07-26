export function validateUrl(
  urlString: string,
  allowedProtocols: string[],
  allowedHostnames: string[],
): boolean {
  try {
    const url = new URL(urlString);
    return allowedProtocols.includes(url.protocol) && allowedHostnames.includes(url.hostname);
  } catch {
    return false;
  }
}
