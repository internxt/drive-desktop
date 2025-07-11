/**
 * Parses the output from MpCmdRun.exe to extract actual virus names
 * @param stdout Standard output from MpCmdRun.exe
 * @param stderr Standard error from MpCmdRun.exe
 * @param isInfected Whether the file is infected
 * @returns Array of virus names found
 */
export function parseVirusNames(stdout: string, stderr: string, isInfected: boolean): string[] {
  if (!isInfected) {
    return [];
  }

  const output = stdout + stderr;
  const virusNames: string[] = [];

  const threatPatterns = [
    /Threat\s+detected:\s+(.+)/gi,
    /Threat\s+(.+?)\s+was\s+detected/gi,
    /Found\s+(.+?)\s+threat/gi,
    /Malware\s+(.+?)\s+detected/gi,
    /Virus\s+(.+?)\s+found/gi,
    /Infected\s+with\s+(.+?)([\s\n]|$)/gi,
  ];

  for (const pattern of threatPatterns) {
    const matches = output.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const virusName = match[1]
          .trim()
          .replace(/^file:/i, '')
          .replace(/["']/g, '');
        if (virusName && !virusNames.includes(virusName)) {
          virusNames.push(virusName);
        }
      }
    }
  }

  if (virusNames.length === 0) {
    virusNames.push('Windows.Defender.Threat.Detected');
  }

  return virusNames;
}
