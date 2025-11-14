const WEB_BROWSER_DIRECTORIES = ['google', 'chromium', 'firefox', 'opera', 'brave', 'chrome', 'mozilla', 'edge'];

export function isDirectoryWebBrowserRelated({ folderName }: { folderName: string }) {
  const lowerName = folderName.toLowerCase();
  return WEB_BROWSER_DIRECTORIES.some((browserName) => lowerName.includes(browserName));
}
