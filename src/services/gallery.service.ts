import { ofetch } from "ofetch";

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export type CrmGalleryMediaType = "image" | "video";
export type CrmGalleryDesignId = "classic" | "magazine" | "film-strip";

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
  title: string;
  status: "published";
  coverUrl: string | null;
  accentColor: string;
  designId?: CrmGalleryDesignId;
  allowDownload: boolean;
  allowSelection: boolean;
  publishedAt: string | null;
  job: {
    title: string;
    eventDate: string | null;
    contact: { name: string } | null;
  };
  studio: { name: string; logoUrl: string | null };
  sections: CrmGallerySection[];
}

export const galleryService = {
  async getPublic(id: string): Promise<PublicGallery> {
    return api<PublicGallery>(`/gallery/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },

  /**
   * Download gallery media as ZIP.
   * Pass mediaIds to limit to selection; omit for entire gallery.
   */
  async downloadZip(id: string, mediaIds?: string[]): Promise<void> {
    const qs =
      mediaIds?.length
        ? `?ids=${mediaIds.map((mid) => encodeURIComponent(mid)).join(",")}`
        : "";
    const blob = await api<Blob>(
      `/gallery/${encodeURIComponent(id)}/download${qs}`,
      {
        method: "GET",
        responseType: "blob",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gallery.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
