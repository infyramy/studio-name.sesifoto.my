import type { CrmGalleryDesignId } from "@/services/gallery.service";

export type { CrmGalleryDesignId };

export const GALLERY_DESIGN_IDS = [
  "classic",
  "magazine",
  "film-strip",
] as const;

export function normalizeGalleryDesignId(
  value: unknown,
): CrmGalleryDesignId {
  if (value === "magazine" || value === "film-strip" || value === "classic") {
    return value;
  }
  return "classic";
}

export type GalleryLayoutItem = {
  id: string;
  label: string;
  url: string;
  type: "photo" | "video";
  aspectClass: string;
  thumb?: string;
  hasThumbnail?: boolean;
};

export type GalleryLayoutSection = {
  id: string;
  name: string;
  items: GalleryLayoutItem[];
};
