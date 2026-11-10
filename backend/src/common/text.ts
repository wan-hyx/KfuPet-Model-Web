export function makeExcerpt(content: string) {
  return content
    .replace(/[#*`>_[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

export function normalizeTags(tags?: string[]) {
  const names: string[] = []

  for (const raw of tags ?? []) {
    const name = raw.replace(/^#+/, '').trim()
    if (!name || name.length > 24 || names.includes(name)) continue
    names.push(name)
    if (names.length >= 6) break
  }

  return names
}
