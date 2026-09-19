import { ofetch } from "ofetch";

export interface ClientActionStudio {
  name: string;
  logoUrl: string | null;
  brandColor: string;
}

export interface ClientActionTermsData {
  jobId: string;
  title: string;
  studio: ClientActionStudio;
  clientName: string | null;
  requireSignature: boolean;
  termsAcceptedAt: string | null;
  signedAt: string | null;
  signerName: string | null;
  signatureImage: string | null;
  contract: {
    id: string | null;
    title: string;
    bodyHtml: string;
    signerHint: string | null;
  };
  payUrl: string | null;
  portalUrl: string | null;
  complete: boolean;
}

export interface ClientActionPayData {
  jobId: string;
  title: string;
  studio: ClientActionStudio;
  clientName: string | null;
  billing: {
    balanceDue: number;
    currency: string | null;
    canPay: boolean;
  };
  invoices: Array<{
    id: string;
    number: string;
    title: string;
    total: number;
    paidAmount: number;
    balanceDue: number;
    currency: string;
    status: string;
    dueDate: string | null;
  }>;
  termsComplete: boolean;
  portalUrl: string | null;
}

export interface ClientActionCheckoutResult {
  intentId: string;
  checkoutUrl: string | null;
  amount: number;
  fee: number;
  totalCharged: number;
  currency: string;
}

export class ClientActionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
    public readonly termsUrl: string | null = null,
  ) {
    super(message);
    this.name = "ClientActionApiError";
  }
}

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

async function request<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (caught: unknown) {
    const response = (
      caught as {
        response?: {
          status?: number;
          _data?: {
            message?: string | Record<string, unknown>;
            code?: string;
            termsUrl?: string;
          };
        };
      }
    ).response;
    const status = response?.status ?? 0;
    const data = response?._data;
    let message = "Unable to complete this request.";
    let code: string | null = null;
    let termsUrl: string | null = null;

    if (data && typeof data.message === "object" && data.message) {
      const nested = data.message as Record<string, unknown>;
      if (typeof nested.message === "string") message = nested.message;
      if (typeof nested.code === "string") code = nested.code;
      if (typeof nested.termsUrl === "string") termsUrl = nested.termsUrl;
    } else if (typeof data?.message === "string" && data.message.trim()) {
      message = data.message;
      if (typeof data.code === "string") code = data.code;
      if (typeof data.termsUrl === "string") termsUrl = data.termsUrl;
    }

    throw new ClientActionApiError(status, code, message, termsUrl);
  }
}

export const clientActionService = {
  getTerms(token: string): Promise<ClientActionTermsData> {
    return request(
      api<ClientActionTermsData>("/client-action/terms", {
        query: { t: token },
      }),
    );
  },

  acceptTerms(
    token: string,
    body: {
      agreed: boolean;
      signerName?: string;
      signatureImage?: string;
    },
  ): Promise<{
    status: string;
    payUrl: string | null;
    portalUrl?: string | null;
    complete?: boolean;
  }> {
    return request(
      api("/client-action/terms/accept", {
        method: "POST",
        query: { t: token },
        body,
      }),
    );
  },

  getPay(token: string): Promise<ClientActionPayData> {
    return request(
      api<ClientActionPayData>("/client-action/pay", {
        query: { t: token },
      }),
    );
  },

  checkout(
    token: string,
    payload: { scope: "all" } | { scope: "invoice"; invoiceId: string },
  ): Promise<ClientActionCheckoutResult> {
    return request(
      api<ClientActionCheckoutResult>("/client-action/pay/checkout", {
        method: "POST",
        query: { t: token },
        body: payload,
      }),
    );
  },
};
