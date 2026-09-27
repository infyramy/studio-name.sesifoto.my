/** ID list normalizer shared by home + portfolio config normalize. */
export function normalizeIdList(input: unknown, max: number): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const row of input) {
    if (typeof row !== "string") continue;
    const id = row.trim().slice(0, 36);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= max) break;
  }
  return ids;
}

/** @deprecated use normalizeIdList */
export const normalizeMediaIds = normalizeIdList;
