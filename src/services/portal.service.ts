import { ofetch } from "ofetch";

export interface PortalSession {
  type: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  cityState: string | null;
}

export interface PortalInvoice {
  id: string;
  number: string;
  title: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  status: "sent" | "overdue" | "paid";
  dueDate: string | null;
}

export interface PortalDeliveryLink {
  id: string;
  name: string;
  url: string;
  expiresAt: string | null;
}

export interface PortalContract {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

export interface PortalInspirationImage {
  id: string;
  imageUrl: string;
  label: string | null;
  sortOrder: number;
}

export interface PortalGalleryPreview {
  id: string;
  title: string;
  coverUrl: string | null;
  publishedAt: string | null;
  preview: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    label: string | null;
  }>;
  path: string;
}

export interface PortalData {
  jobId: string;
  title: string;
  status: string;
  portalHeroUrl: string | null;
  accentColor: string;
  shareUrl: string;
  hasPasscode: boolean;
  studio: {
    name: string;
    whatsapp: string | null;
    logoUrl: string | null;
    brandColor: string;
  };
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  sessions: PortalSession[];
  billing: {
    totalInvoiced: number;
    totalPaid: number;
    balanceDue: number;
    currency: string | null;
    hasMixedCurrencies: boolean;
    canPayAll: boolean;
  };
  invoices: PortalInvoice[];
  deliveryLinks: PortalDeliveryLink[];
  contracts: PortalContract[];
  inspirationImages: PortalInspirationImage[];
  gallery: PortalGalleryPreview | null;
}

export interface ExchangePortalSessionRequest {
  token: string;
  passcode?: string;
}

export interface PortalAccessGate {
  heroUrl: string | null;
  clientName: string;
  accentColor: string;
}

export type ExchangePortalSessionResponse =
  | { status: "authenticated"; shareUrl: string }
  | { status: "passcode_required"; gate: PortalAccessGate };

export interface ChangePortalPasscodeRequest {
  currentPasscode: string;
  newPasscode: string;
}

export interface ChangePortalPasscodeResponse {
  status: "ok";
  shareUrl: string;
}

export type PortalPaymentIntentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

export type CreatePortalCheckoutRequest =
  | { scope: "all" }
  | { scope: "invoice"; invoiceId: string };

export interface PortalPaymentIntent {
  intentId: string;
  scope: "invoice" | "all";
  amount: number;
  fee: number;
  totalCharged: number;
  currency: string;
  status: PortalPaymentIntentStatus;
  checkoutUrl: string | null;
  expiresAt: string | null;
}

export type PortalErrorCode =
  | "PORTAL_TOKEN_INVALID"
  | "PORTAL_PASSCODE_INCORRECT"
  | "PORTAL_CURRENT_PASSCODE_INCORRECT";

export class PortalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: PortalErrorCode | null,
    message: string,
  ) {
    super(message);
    this.name = "PortalApiError";
  }
}

export interface PortalRequestOptions {
  signal?: AbortSignal;
}

const portalApi = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  credentials: "include",
});

async function portalRequest<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (caught: unknown) {
    if (!caught || typeof caught !== "object") {
      throw new PortalApiError(0, null, "Unable to reach the portal.");
    }

    const response = (
      caught as {
        response?: {
          status?: unknown;
          _data?: { message?: unknown; code?: unknown };
        };
      }
    ).response;
    const status = typeof response?.status === "number" ? response.status : 0;
    const rawCode = response?._data?.code;
    const code =
      rawCode === "PORTAL_TOKEN_INVALID"
      || rawCode === "PORTAL_PASSCODE_INCORRECT"
      || rawCode === "PORTAL_CURRENT_PASSCODE_INCORRECT"
        ? rawCode
        : null;
    const rawMessage = response?._data?.message;
    const message =
      typeof rawMessage === "string" && rawMessage.trim()
        ? rawMessage
        : "Unable to complete the portal request.";

    throw new PortalApiError(status, code, message);
  }
}

export const portalService = {
  exchangeSession(
    jobId: string,
    payload: ExchangePortalSessionRequest,
    options: PortalRequestOptions = {},
  ): Promise<ExchangePortalSessionResponse> {
    return portalRequest(
      portalApi<ExchangePortalSessionResponse>(
        `/portal/${encodeURIComponent(jobId)}/session`,
        {
          method: "POST",
          body: payload,
          signal: options.signal,
        },
      ),
    );
  },

  getPortalData(
    jobId: string,
    options: PortalRequestOptions = {},
  ): Promise<PortalData> {
    return portalRequest(
      portalApi<PortalData>(`/portal/${encodeURIComponent(jobId)}`, {
        signal: options.signal,
      }),
    );
  },

  getInvoicePdf(
    jobId: string,
    invoiceId: string,
    options: PortalRequestOptions = {},
  ): Promise<Blob> {
    return portalRequest(
      portalApi<Blob>(
        `/portal/${encodeURIComponent(jobId)}/invoices/${encodeURIComponent(invoiceId)}/pdf`,
        { responseType: "blob", signal: options.signal },
      ),
    );
  },

  createCheckout(
    jobId: string,
    payload: CreatePortalCheckoutRequest,
    options: PortalRequestOptions = {},
  ): Promise<PortalPaymentIntent> {
    return portalRequest(
      portalApi<PortalPaymentIntent>(
        `/portal/${encodeURIComponent(jobId)}/payment-intents`,
        {
          method: "POST",
          body: payload,
          signal: options.signal,
        },
      ),
    );
  },

  getPaymentIntent(
    jobId: string,
    intentId: string,
    options: PortalRequestOptions = {},
  ): Promise<PortalPaymentIntent> {
    return portalRequest(
      portalApi<PortalPaymentIntent>(
        `/portal/${encodeURIComponent(jobId)}/payment-intents/${encodeURIComponent(intentId)}`,
        { signal: options.signal },
      ),
    );
  },

  changePasscode(
    jobId: string,
    payload: ChangePortalPasscodeRequest,
    options: PortalRequestOptions = {},
  ): Promise<ChangePortalPasscodeResponse> {
    return portalRequest(
      portalApi<ChangePortalPasscodeResponse>(
        `/portal/${encodeURIComponent(jobId)}/passcode`,
        {
          method: "PUT",
          body: payload,
          signal: options.signal,
        },
      ),
    );
  },
};
