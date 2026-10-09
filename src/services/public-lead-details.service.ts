import { ofetch } from "ofetch";

export interface PublicLeadDetailsSession {
  type?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  cityState?: string;
}

export interface PublicLeadDetailsPackageItem {
  id: string;
  name: string;
  itemType: string | null;
  shortDescription: string | null;
  category: string | null;
  unitPrice: number;
  pricingUnit: string | null;
  quantityMode: string | null;
  imageUrl: string | null;
  quantity: number;
  inclusions: string[];
}

export interface PublicLeadDetailsPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  items: PublicLeadDetailsPackageItem[];
}

export interface PublicLeadDetailsForm {
  submitted: boolean;
  autoCreateQuotation: boolean;
  studioName: string;
  studioBrandColor: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  serviceInterest: string | null;
  notes: string | null;
  sessions: PublicLeadDetailsSession[];
  selectedPackageIds: string[];
  packages: PublicLeadDetailsPackage[];
  quotationPublicUrl: string | null;
}

export interface PublicLeadDetailsSubmitPayload {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceInterest: string;
  notes?: string;
  sessions?: PublicLeadDetailsSession[];
  packageIds?: string[];
}

export interface PublicLeadDetailsSubmitResult {
  leadId: string;
  quotationPublicUrl: string | null;
}

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export function fetchPublicLeadDetails(token: string) {
  return api<PublicLeadDetailsForm>(
    `/public/lead-details/${encodeURIComponent(token)}`,
  );
}

export function submitPublicLeadDetails(
  token: string,
  payload: PublicLeadDetailsSubmitPayload,
) {
  return api<PublicLeadDetailsSubmitResult>(
    `/public/lead-details/${encodeURIComponent(token)}`,
    { method: "POST", body: payload },
  );
}
