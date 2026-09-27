import type { Theme } from "@/types";

export interface CartHold {
  holdId: string;
  sessionId: string;
  studioId: string;
  themeId: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  createdAt: string;
}

export interface BookingCartItem {
  id: string;
  theme: Theme;
  date: string;
  slot: any;
  pax: number;
  addons: Record<string, number>;
  total: number;
  dateInfo?: any;
  hold?: CartHold;
  specialPricing?: {
    message: string;
    amount: number;
  };
}

export interface BookingPersistedState {
  mode: "cart" | "single";
  sessionId: string;
  studioSlug: string;
  selectedTheme: Theme | null;
  selectedDate: string | null;
  selectedSlot: any;
  selectedSlots: any[];
  confirmedSlot: any;
  confirmedSlots: any[];
  paxCount: number;
  selectedAddons: Record<string, number>;
  addonsApplyTo: "all" | "firstOnly";
  cartItems: BookingCartItem[];
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  currentStep: number;
  termsAccepted: boolean;
  savedAt: string;
}
