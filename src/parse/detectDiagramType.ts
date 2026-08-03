const FLOWCHART_HEADER = /^(?:flowchart|graph)\s+(?:LR|TD|TB|RL|BT)\b/i

/** True if `source`'s first meaningful line is a flowchart/graph header — the only diagram
 *  type this app's canvas can represent (spec §10.3, §11). Everything else is code-only. */
export function isFlowchartSource(source: string): boolean {
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('%%')) continue
    return FLOWCHART_HEADER.test(line)
  }
  return false
}
