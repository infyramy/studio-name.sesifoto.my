import { ofetch } from "ofetch";

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export type CrmGalleryMediaType = "image" | "video";

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
};
