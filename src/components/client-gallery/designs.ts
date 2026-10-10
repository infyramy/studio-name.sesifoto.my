import type {
  CrmGalleryDesignId,
  GalleryGridStyle,
  GallerySizeStep,
} from "@/services/gallery.service";

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

export type GalleryPhotoGridLayout = {
  gridStyle: GalleryGridStyle;
  photoSize: GallerySizeStep;
  photoGap: GallerySizeStep;
};

/** Design + permission switches shared by every site template. */
export interface GalleryViewOptions {
  heroTitle: string;
  heroSubtitle: string;
  hideHero: boolean;
  canToggleTheme: boolean;
  canShare: boolean;
  photoGrid: GalleryPhotoGridLayout | null;
}
