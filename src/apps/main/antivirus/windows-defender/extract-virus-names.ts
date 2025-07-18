export function extractVirusNamesFromOutput({ output }: { output: string }) {
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

  return virusNames;
}
