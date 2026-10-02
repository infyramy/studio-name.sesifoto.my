import { ofetch } from "ofetch";

export interface PublicQuotation {
  id: string;
  number: string;
  title: string;
  status: string;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  paymentTerms?: string | null;
  paymentSchedule?: string | null;
  depositType?: string | null;
  depositValue?: number | null;
  paymentMilestones?: Array<{ label: string; amount: number }> | null;
  eventTitle?: string | null;
  pdfUrl?: string | null;
  postAcceptPayUrl?: string | null;
  postAcceptInvoiceUrl?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  rounding: number;
  total: number;
  currency: string;
  clientName: string | null;
  canRespond: boolean;
  items: Array<{
    id: string;
    description: string;
    detail: string | null;
    unit: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    amount: number;
  }>;
  studio: {
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string;
  };
}

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export function fetchPublicQuotation(token: string) {
  return api<PublicQuotation>(`/public/quotations/${encodeURIComponent(token)}`);
}

export function acceptPublicQuotation(token: string) {
  return api<PublicQuotation>(
    `/public/quotations/${encodeURIComponent(token)}/accept`,
    { method: "POST" },
  );
}

export function declinePublicQuotation(token: string) {
  return api<PublicQuotation>(
    `/public/quotations/${encodeURIComponent(token)}/decline`,
    { method: "POST" },
  );
}
