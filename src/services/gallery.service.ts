import { ofetch } from "ofetch";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = ofetch.create({
  baseURL: API_BASE,
});

export type CrmGalleryMediaType = "image" | "video";
export type CrmGalleryDesignId = "classic" | "magazine" | "film-strip";
export type GalleryHeroTheme =
  | "pile"
  | "slideshow"
  | "scroll-title"
  | "split"
  | "overlay-portrait"
  | "collage"
  | "organic";
export type GalleryGridStyle =
  | "masonry"
  | "justified"
  | "grid"
  | "square"
  | "wide"
  | "mosaic";
export type GallerySizeStep = "small" | "medium" | "large";
export type GalleryDownloadQuality = "web" | "high";
export type GallerySelectionStatus = "open" | "submitted";

export interface GallerySelection {
  limit: number | null;
  status: GallerySelectionStatus;
  submittedAt: string | null;
  pickedMediaIds: string[];
  requiresSignIn: boolean;
}

export interface GalleryDesignSettings {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroTheme?: GalleryHeroTheme | null;
  heroSpeed?: number;
  palette?: string;
  heroBackground?: string;
  textColor?: string;
  contentBackground?: string;
  fontSet?: string;
  fontPrimary?: string;
  fontSecondary?: string;
  gridStyle?: GalleryGridStyle;
  photoSize?: GallerySizeStep;
  photoGap?: GallerySizeStep;
  showLogo?: boolean;
  logoSize?: GallerySizeStep;
  logoMode?: "light" | "dark";
}

export interface CrmGalleryMedia {
  id: string;
  type: CrmGalleryMediaType;
  url: string;
  thumbnailUrl: string | null;
  label: string | null;
  sortOrder: number;
}

export interface CrmGallerySection {
  id: string;
  name: string;
  sortOrder: number;
  media: CrmGalleryMedia[];
}

export interface PublicGallery {
  id: string;
  locked: false;
  jobId: string;
  title: string;
  status: "published";
  coverUrl: string | null;
  accentColor: string;
  designId?: CrmGalleryDesignId;
  allowDownload: boolean;
  allowSelection: boolean;
  allowLinkSharing: boolean;
  allowPhotoSharing: boolean;
  watermarkEnabled: boolean;
  download: {
    webRes: boolean;
    highRes: boolean;
    clientOnly: boolean;
    requiresSignIn: boolean;
  };
  selection: GallerySelection;
  designSettings: GalleryDesignSettings | null;
  galleryType: string | null;
  description: string | null;
  location: string | null;
  galleryDate: string | null;
  publishedAt: string | null;
  job: {
    title: string;
    eventDate: string | null;
    contact: { name: string } | null;
  };
  studio: { name: string; logoUrl: string | null };
  sections: CrmGallerySection[];
}

export interface LockedGallery {
  id: string;
  locked: true;
  jobId: string;
  title: string;
  accentColor: string;
  designSettings: GalleryDesignSettings | null;
  studio: { name: string; logoUrl: string | null };
}

const ACCESS_HEADER = "x-gallery-access";

function accessKey(id: string) {
  return `sesifoto_gallery_access:${id}`;
}

function readAccessToken(id: string): string | null {
  try {
    return sessionStorage.getItem(accessKey(id));
  } catch {
    return null;
  }
}

function storeAccessToken(id: string, token: string | null) {
  try {
    if (token) sessionStorage.setItem(accessKey(id), token);
    else sessionStorage.removeItem(accessKey(id));
  } catch {
    // ignore
  }
}

function accessHeaders(id: string): Record<string, string> {
  const token = readAccessToken(id);
  return token ? { [ACCESS_HEADER]: token } : {};
}

function shortHash(value: string): string {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}

/** One-colour studio logo for the Light / Dark logo mode; `v` busts the cache when the logo changes. */
export function galleryMonoLogoUrl(
  galleryId: string,
  logoUrl: string,
  mode: "light" | "dark",
): string {
  return `${API_BASE.replace(/\/$/, "")}/gallery/${encodeURIComponent(galleryId)}/logo?mode=${mode}&v=${shortHash(logoUrl)}`;
}

/** Extracts the HTTP status and server message from an ofetch error. */
export function galleryErrorInfo(error: unknown): { status: number; message: string } {
  const err = error as {
    statusCode?: number;
    status?: number;
    data?: { message?: string | string[] };
    message?: string;
  };
  const raw = err?.data?.message;
  const message = (Array.isArray(raw) ? raw[0] : raw) || err?.message || "";
  return { status: err?.statusCode ?? err?.status ?? 0, message };
}

export const galleryService = {
  async getPublic(id: string): Promise<PublicGallery | LockedGallery> {
    return api<PublicGallery | LockedGallery>(
      `/gallery/${encodeURIComponent(id)}`,
      { method: "GET", headers: accessHeaders(id) },
    );
  },

  async unlock(id: string, passcode: string): Promise<void> {
    const result = await api<{ token: string | null }>(
      `/gallery/${encodeURIComponent(id)}/unlock`,
      { method: "POST", body: { passcode } },
    );
    if (result.token) storeAccessToken(id, result.token);
  },

  /**
   * Exchanges the visitor's client portal session for gallery access.
   * Returns false when they are not signed in for this job.
   */
  async requestPortalAccess(jobId: string, id: string): Promise<boolean> {
    try {
      const result = await api<{ token: string }>(
        `/portal/${encodeURIComponent(jobId)}/galleries/${encodeURIComponent(id)}/access`,
        { method: "POST", credentials: "include" },
      );
      storeAccessToken(id, result.token);
      return true;
    } catch {
      return false;
    }
  },

  async addPick(id: string, mediaId: string): Promise<GallerySelection> {
    return api<GallerySelection>(
      `/gallery/${encodeURIComponent(id)}/picks/${encodeURIComponent(mediaId)}`,
      { method: "PUT", headers: accessHeaders(id) },
    );
  },

  async removePick(id: string, mediaId: string): Promise<GallerySelection> {
    return api<GallerySelection>(
      `/gallery/${encodeURIComponent(id)}/picks/${encodeURIComponent(mediaId)}`,
      { method: "DELETE", headers: accessHeaders(id) },
    );
  },

  async clearPicks(id: string): Promise<GallerySelection> {
    return api<GallerySelection>(
      `/gallery/${encodeURIComponent(id)}/picks`,
      { method: "DELETE", headers: accessHeaders(id) },
    );
  },

  async submitPicks(id: string): Promise<GallerySelection> {
    return api<GallerySelection>(
      `/gallery/${encodeURIComponent(id)}/picks/submit`,
      { method: "POST", headers: accessHeaders(id) },
    );
  },

  /**
   * Download gallery media as ZIP.
   * Pass mediaIds to limit to selection; omit for entire gallery.
   */
  async downloadZip(
    id: string,
    options: { mediaIds?: string[]; quality?: GalleryDownloadQuality; fileName?: string } = {},
  ): Promise<void> {
    const params = new URLSearchParams();
    if (options.mediaIds?.length) params.set("ids", options.mediaIds.join(","));
    if (options.quality) params.set("quality", options.quality);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const blob = await api<Blob, "blob">(
      `/gallery/${encodeURIComponent(id)}/download${qs}`,
      {
        method: "GET",
        responseType: "blob",
        headers: accessHeaders(id),
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = options.fileName || "gallery.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
