/** Turn a pool name into a stable id slug (lowercase, hyphenated). */
export function slugifyPoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Build a unique pool id; append -2, -3 if the base slug is taken. */
export function uniquePoolId(name: string, usedIds: Set<string>): string {
  const base = slugifyPoolName(name) || "pool";
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }
  let n = 2;
  while (usedIds.has(`${base}-${n}`)) n += 1;
  const id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}
