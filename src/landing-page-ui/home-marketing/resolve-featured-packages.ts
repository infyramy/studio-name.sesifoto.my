import type { HomeFeaturedPackage } from "./types";

export type CrmPackageLike = {
  id: string;
  name: string;
  price: number;
  status?: string;
  imageUrl?: string | null;
  items?: Array<{
    catalogItemId?: string | null;
    sortOrder?: number;
  }>;
};

export function formatFeaturedPackagePrice(price: number): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return "";
  return `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function firstCatalogImageUrl(
  pkg: CrmPackageLike,
  catalogImageById?: Map<string, string | null | undefined>,
): string {
  if (typeof pkg.imageUrl === "string" && pkg.imageUrl.trim()) {
    return pkg.imageUrl.trim();
  }
  if (!catalogImageById || !pkg.items?.length) return "";
  const sorted = [...pkg.items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  for (const item of sorted) {
    const id = item.catalogItemId?.trim();
    if (!id) continue;
    const url = catalogImageById.get(id)?.trim();
    if (url) return url;
  }
  return "";
}

/** Resolve ordered CRM package IDs into home display cards. */
export function resolveFeaturedPackages(
  ids: string[],
  packages: CrmPackageLike[],
  catalogImageById?: Map<string, string | null | undefined>,
): HomeFeaturedPackage[] {
  const byId = new Map(packages.map((p) => [p.id, p]));
  const out: HomeFeaturedPackage[] = [];
  for (const id of ids) {
    const pkg = byId.get(id);
    if (!pkg) continue;
    if (pkg.status && pkg.status !== "active") continue;
    out.push({
      id: pkg.id,
      title: pkg.name,
      price: formatFeaturedPackagePrice(pkg.price),
      imageUrl: firstCatalogImageUrl(pkg, catalogImageById),
      detailLabel: "Pilih",
      detailUrl: "/lead-form",
    });
    if (out.length >= 6) break;
  }
  return out;
}
