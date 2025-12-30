import { ofetch } from "ofetch";
import type {
  Studio,
  Theme,
  Addon,
  WorkingHours,
  BlackoutDate,
  PricingRule,
  TimeSlot,
  DateSlotInfo,
  BookingRequest,
  Booking,
  Coupon,
  WebsiteSettings,
} from "@/types";

// API base URL - uses environment variable or defaults to localhost
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Create ofetch instance with base config
const apiFetch = ofetch.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  retry: 1,
  retryDelay: 500,
});

// Helper to get studio slug
const getStudioSlug = (): string => {
  // Try to get from subdomain first
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // For production: studio-name.sesifoto.my
  if (parts.length >= 3 && parts[1] === "sesifoto") {
    return parts[0];
  }

  // For development with query param: localhost:5173?studio=demo-studio
  const urlParams = new URLSearchParams(window.location.search);
  const studioParam = urlParams.get("studio");
  if (studioParam) {
    return studioParam;
  }

  // Try sessionStorage
  const stored = sessionStorage.getItem("current_studio_slug");
  if (stored) {
    return stored;
  }

  // Default fallback for development
  return "demo-studio";
};

// Transform backend response to frontend types
const transformStudio = (data: any): Studio => ({
  id: data.id,
  slug: data.slug,
  name: data.name,
  owner_name: data.name, // Not provided by public API
  whatsapp: data.whatsapp || "",
  instagram: data.instagram,
  facebook: data.facebook,
  tiktok: data.tiktok,
  pinterest: data.pinterest,
  address: data.address || "",
  maps_link: data.mapsLink || "",
  logo_url: data.logoUrl || "",
  brand_color: data.brandColor,
  default_language: data.defaultLanguage as "BM" | "EN",
  timezone: data.timezone,
  currency: data.currency,
  status: "active",
  settings: {
    cart_mode_enabled: false,
    cart_hold_duration: 10,
    deposit_percentage: 50,
    payment_type: "deposit",
    booking_window_start: null,
    booking_window_end: null,
    booking_open: true,
    buffer_minutes: 15,
    auto_cutoff_hours: 0,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const transformTheme = (data: any): Theme => ({
  id: data.id,
  studio_id: "", // Will be set by caller
  name: data.name,
  description_short: data.descriptionShort || "",
  description_long: data.descriptionLong || "",
  images: data.images || [],
  base_price: data.basePrice,
  base_pax: data.basePax,
  extra_pax_price: data.extraPaxPrice || 0,
  duration_minutes: data.durationMinutes,
  buffer_minutes: data.bufferMinutes || null,
  strict_max_people: data.strictMaxPeople ?? false,
  max_total_people: data.maxTotalPeople || data.basePax || 1,
  status: "active",
  sort_order: data.sortOrder,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_deposit: data.paymentMode === "deposit",
  deposit_amount: data.depositAmount, // Fixed deposit amount in sen
  payment_mode: data.paymentMode, // "deposit" or "full"
});

const transformAddon = (data: any): Addon => ({
  id: data.id,
  studio_id: "",
  name: data.name,
  price: data.price,
  max_quantity: data.maxQuantity || null,
  addon_type: data.addonType || "quantity", // Map from backend
  status: "active",
  sort_order: data.sortOrder,
  image: data.image,
  created_at: new Date().toISOString(),
});

const transformWorkingHours = (data: any): WorkingHours => ({
  id: `wh-${data.dayOfWeek}`,
  studio_id: "",
  day_of_week: data.dayOfWeek,
  active: data.active,
  start: data.start,
  end: data.end,
  created_at: new Date().toISOString(),
});

const transformBlackoutDate = (data: any): BlackoutDate => ({
  id: `bd-${data.startDate}`,
  studio_id: "",
  title: data.title || "Closed",
  start_date: data.startDate,
  end_date: data.endDate || null,
  reason: data.title || "",
  created_at: new Date().toISOString(),
});

const transformPricingRule = (data: any): PricingRule => ({
  id: `pr-${data.dateRangeStart}`,
  studio_id: "",
  name: data.name || "Special Pricing",
  date_range_start: data.dateRangeStart,
  date_range_end: data.dateRangeEnd,
  rule_type: data.ruleType as "percentage_increase" | "fixed_price",
  value: data.value,
  applies_to_themes: "all",
  status: "active",
  created_at: new Date().toISOString(),
});

const transformDateSlotInfo = (data: any): DateSlotInfo => ({
  date: data.date,
  status: data.status,
  slots_available: data.slotsAvailable,
  slots_total: data.slotsTotal,
  special_pricing_label: data.specialPricingLabel,
});

const transformTimeSlot = (data: any): TimeSlot => ({
  start: data.start,
  end: data.end,
  status: data.available ? "available" : "booked",
  price: data.price,
  is_special_pricing: data.isSpecialPricing,
  special_pricing_label: data.specialPricingLabel,
});

// API Service
export const api = {
  // ===== Studio APIs =====
  async getStudioBySlug(slug: string): Promise<Studio> {
    const data = await apiFetch(`/public/studio/${slug}`);
    const studio = transformStudio(data);

    // Get website settings to update studio settings
    try {
      const settings = await apiFetch(
        `/public/studio/${slug}/website-settings`
      );
      studio.settings = {
        cart_mode_enabled: settings.cartModeEnabled,
        cart_hold_duration: settings.cartHoldDuration,
        deposit_percentage: 50,
        payment_type: settings.paymentType as "deposit" | "full",
        booking_window_start: null,
        booking_window_end: null,
        booking_open: settings.bookingOpen,
        buffer_minutes: 15,
        auto_cutoff_hours: 0,
      };

      // Apply website settings language if available (takes precedence)
      if (settings.defaultLanguage) {
        studio.default_language = settings.defaultLanguage as "BM" | "EN";
      }
    } catch (e) {
      // Use defaults if settings not found
    }

    return studio;
  },

  // Check if studio exists (lightweight check)
  studioExists(slug: string): boolean {
    // This is sync, so we can't make an API call
    // Return true and let the actual fetch handle errors
    return true;
  },

  // Get website settings with hero style config
  async getWebsiteSettings(slug: string): Promise<WebsiteSettings> {
    const data = await apiFetch(`/public/studio/${slug}/website-settings`);
    return {
      bookingOpen: data.bookingOpen,
      defaultLanguage: data.defaultLanguage as "BM" | "EN",
      paymentType: data.paymentType as "deposit" | "full",
      cartModeEnabled: data.cartModeEnabled,
      cartHoldDuration: data.cartHoldDuration,
      selectedStyle: data.selectedStyle as "rustic" | "modern" | "luxe",
      bookingWindowStart: data.bookingWindowStart,
      bookingWindowEnd: data.bookingWindowEnd,
      heroConfig: data.heroConfig
        ? {
            styleKey: data.heroConfig.styleKey as "rustic" | "modern" | "luxe",
            heading: data.heroConfig.heading,
            headingColor: data.heroConfig.headingColor,
            highlightText: data.heroConfig.highlightText,
            highlightColor: data.heroConfig.highlightColor,
            testimonial: data.heroConfig.testimonial,
            supportingColor: data.heroConfig.supportingColor,
            buttonBgColor: data.heroConfig.buttonBgColor,
            buttonTextColor: data.heroConfig.buttonTextColor,
            cardOpacity: data.heroConfig.cardOpacity,
            backgroundColor: data.heroConfig.backgroundColor,
            primaryTextColor: data.heroConfig.primaryTextColor,
            invertTheme: data.heroConfig.invertTheme,
            backgroundImages: data.heroConfig.backgroundImages || [],
          }
        : undefined,
    };
  },

  // ===== Theme APIs =====
  async getThemesByStudio(studioId: string): Promise<Theme[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/themes`);
    return data.map((t: any) => ({
      ...transformTheme(t),
      studio_id: studioId,
    }));
  },

  async getThemeById(themeId: string): Promise<Theme | null> {
    // Get all themes and find by ID
    const slug = getStudioSlug();
    try {
      const themes = await apiFetch(`/public/studio/${slug}/themes`);
      const theme = themes.find((t: any) => t.id === themeId);
      return theme ? transformTheme(theme) : null;
    } catch {
      return null;
    }
  },

  // ===== Add-ons APIs =====
  async getAddonsByStudio(studioId: string): Promise<Addon[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/addons`);
    return data.map((a: any) => ({
      ...transformAddon(a),
      studio_id: studioId,
    }));
  },

  async getAddonById(addonId: string): Promise<Addon | null> {
    const slug = getStudioSlug();
    try {
      const addons = await apiFetch(`/public/studio/${slug}/addons`);
      const addon = addons.find((a: any) => a.id === addonId);
      return addon ? transformAddon(addon) : null;
    } catch {
      return null;
    }
  },

  // ===== Working Hours APIs =====
  async getWorkingHours(studioId: string): Promise<WorkingHours[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/working-hours`);
    return data.map((wh: any) => ({
      ...transformWorkingHours(wh),
      studio_id: studioId,
    }));
  },

  // ===== Blackout Dates APIs =====
  async getBlackoutDates(studioId: string): Promise<BlackoutDate[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/blackout-dates`);
    return data.map((b: any) => ({
      ...transformBlackoutDate(b),
      studio_id: studioId,
    }));
  },

  // ===== Pricing Rules APIs =====
  async getPricingRules(studioId: string): Promise<PricingRule[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/pricing-rules`);
    return data.map((r: any) => ({
      ...transformPricingRule(r),
      studio_id: studioId,
    }));
  },

  // ===== Terms and Conditions API =====
  async getTerms(): Promise<{
    contentBm?: string;
    contentEn?: string;
    pdfUrl?: string;
  }> {
    const slug = getStudioSlug();
    try {
      const data = await apiFetch(`/public/studio/${slug}/terms`);
      return {
        contentBm: data.contentBm,
        contentEn: data.contentEn,
        pdfUrl: data.pdfUrl,
      };
    } catch {
      return {};
    }
  },

  // ===== Slot Availability APIs =====
  async getAvailableDates(
    studioId: string,
    themeId: string,
    startDate: string,
    endDate: string
  ): Promise<DateSlotInfo[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(`/public/studio/${slug}/available-dates`, {
      query: { themeId, startDate, endDate },
    });
    return data.map(transformDateSlotInfo);
  },

  async getAvailableTimeSlots(
    studioId: string,
    themeId: string,
    date: string
  ): Promise<TimeSlot[]> {
    const slug = getStudioSlug();
    const data = await apiFetch(
      `/public/studio/${slug}/themes/${themeId}/slots`,
      {
        query: { date },
      }
    );
    return data.map(transformTimeSlot);
  },

  // ===== Coupon APIs =====
  async validateCoupon(code: string, subtotal: number = 0): Promise<Coupon> {
    const slug = getStudioSlug();
    const data = await apiFetch("/public/coupons/validate", {
      method: "POST",
      body: { studioSlug: slug, code, subtotal },
    });

    return {
      id: data.id,
      code: data.code,
      type: data.type as "percentage" | "fixed",
      value: data.value,
      valid_from: null,
      valid_until: null,
      usage_limit: null,
      usage_count: 0,
      min_spend: data.minSpend || null,
      status: "active",
      created_at: new Date().toISOString(),
    };
  },

  // ===== Booking APIs =====
  async createBooking(request: BookingRequest): Promise<Booking> {
    const slug = getStudioSlug();

    const data = await apiFetch("/public/bookings", {
      method: "POST",
      body: {
        studioSlug: slug,
        themeId: request.theme_id,
        bookingDate: request.booking_date,
        startTime: request.start_time,
        endTime: request.end_time,
        paxCount: request.pax_count,
        customerName: request.customer_name,
        customerPhone: request.customer_phone,
        customerEmail: request.customer_email,
        customerNotes: request.customer_notes,
        consentTc: request.consent_tc,
        consentMarketing: request.consent_marketing,
        addons: request.selected_addons.map((a) => ({
          addonId: a.addon_id,
          quantity: a.quantity,
        })),
        couponCode: request.coupon_code,
        sessionId: request.session_id,
      },
    });

    // Get theme info
    const theme = await this.getThemeById(request.theme_id);

    return {
      id: data.id,
      studio_id: slug,
      booking_number: data.bookingNumber,
      theme_id: request.theme_id,
      theme: theme!,
      booking_date: data.bookingDate,
      start_time: data.startTime,
      end_time: data.endTime,
      pax_count: request.pax_count,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: request.customer_email || "",
      customer_notes: request.customer_notes || "",
      consent_tc: request.consent_tc,
      consent_marketing: request.consent_marketing,
      base_price: theme?.base_price || 0,
      extra_pax_fee: 0,
      addons_total: 0,
      special_pricing_applied: 0,
      coupon_code: request.coupon_code,
      discount_amount: request.discount_amount || 0,
      total_amount: data.totalAmount,
      deposit_amount: data.depositAmount,
      balance_amount: data.balanceAmount,
      payment_status: data.paymentStatus as any,
      booking_status: data.bookingStatus as any,
      cart_hold_expires_at: data.cartHoldExpiresAt || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      addons: [],
    };
  },

  async getBookingByIdAndPhone(
    bookingNumber: string,
    phone: string
  ): Promise<Booking | null> {
    try {
      const data = await apiFetch("/public/bookings/lookup", {
        query: { bookingNumber, phone },
      });

      return {
        id: data.id,
        studio_id: "",
        booking_number: data.bookingNumber,
        theme_id: "",
        theme: {
          id: "",
          studio_id: "",
          name: data.themeName,
          description_short: "",
          description_long: "",
          images: [],
          base_price: 0,
          base_pax: 0,
          extra_pax_price: 0,
          duration_minutes: 0,
          buffer_minutes: null,
          strict_max_people: false,
          max_total_people: 0,
          status: "active",
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
        booking_date: data.bookingDate,
        start_time: data.startTime,
        end_time: data.endTime,
        pax_count: 0,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: "",
        customer_notes: "",
        consent_tc: true,
        consent_marketing: false,
        base_price: 0,
        extra_pax_fee: 0,
        addons_total: 0,
        special_pricing_applied: 0,
        total_amount: data.totalAmount,
        deposit_amount: data.depositAmount,
        balance_amount: data.balanceAmount,
        payment_status: data.paymentStatus as any,
        booking_status: data.bookingStatus as any,
        cart_hold_expires_at: data.cartHoldExpiresAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        addons: [],
      };
    } catch {
      return null;
    }
  },

  // Get booking by booking number (for success page)
  async getBookingByNumber(bookingNumber: string): Promise<Booking | null> {
    try {
      const data = await apiFetch(`/public/bookings/${bookingNumber}`);

      return {
        id: data.id,
        studio_id: "",
        booking_number: data.bookingNumber,
        theme_id: "",
        theme: {
          id: "",
          studio_id: "",
          name: data.themeName,
          description_short: "",
          description_long: "",
          images: data.themeImage ? [data.themeImage] : [],
          base_price: data.basePrice || 0,
          base_pax: data.basePax || 0,
          extra_pax_price: 0,
          duration_minutes: 0,
          buffer_minutes: null,
          strict_max_people: false,
          max_total_people: 0,
          status: "active",
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
        booking_date: data.bookingDate,
        start_time: data.startTime,
        end_time: data.endTime,
        pax_count: data.paxCount || 0,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: "",
        customer_notes: "",
        consent_tc: true,
        consent_marketing: false,
        base_price: data.basePrice || 0,
        extra_pax_fee: data.extraPaxFee || 0,
        addons_total: data.addonsTotal || 0,
        special_pricing_applied: data.specialPricingApplied || 0,
        special_pricing_label: data.specialPricingLabel || null,
        coupon_code: data.couponCode || null,
        discount_amount: data.discountAmount || 0,
        total_amount: data.totalAmount,
        deposit_amount: data.depositAmount,
        balance_amount: data.balanceAmount,
        payment_status: data.paymentStatus as any,
        booking_status: data.bookingStatus as any,
        cart_hold_expires_at: data.cartHoldExpiresAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        addons:
          data.addons?.map((a: any) => ({
            addon: { name: a.name, price: a.price / a.quantity },
            quantity: a.quantity,
            price_at_booking: a.price,
          })) || [],
      };
    } catch {
      return null;
    }
  },

  // Lookup booking by booking number and phone (for check booking page)
  async lookupBooking(
    bookingNumber: string,
    phone: string
  ): Promise<Booking | null> {
    try {
      const data = await apiFetch(
        `/public/bookings/lookup?bookingNumber=${encodeURIComponent(
          bookingNumber
        )}&phone=${encodeURIComponent(phone)}`
      );

      return {
        id: data.id,
        studio_id: "",
        booking_number: data.bookingNumber,
        theme_id: "",
        theme: {
          id: "",
          studio_id: "",
          name: data.themeName,
          description_short: "",
          description_long: "",
          images: data.themeImage ? [data.themeImage] : [],
          base_price: data.basePrice || 0,
          base_pax: data.basePax || 0,
          extra_pax_price: 0,
          duration_minutes: 0,
          buffer_minutes: null,
          strict_max_people: false,
          max_total_people: 0,
          status: "active",
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
        booking_date: data.bookingDate,
        start_time: data.startTime,
        end_time: data.endTime,
        pax_count: data.paxCount || 0,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: "",
        customer_notes: "",
        consent_tc: true,
        consent_marketing: false,
        base_price: data.basePrice || 0,
        extra_pax_fee: data.extraPaxFee || 0,
        addons_total: data.addonsTotal || 0,
        special_pricing_applied: data.specialPricingApplied || 0,
        special_pricing_label: data.specialPricingLabel || null,
        coupon_code: data.couponCode || null,
        discount_amount: data.discountAmount || 0,
        total_amount: data.totalAmount,
        deposit_amount: data.depositAmount,
        balance_amount: data.balanceAmount,
        payment_status: data.paymentStatus as any,
        booking_status: data.bookingStatus as any,
        cart_hold_expires_at: data.cartHoldExpiresAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        addons:
          data.addons?.map((a: any) => ({
            addon: { name: a.name, price: a.price / a.quantity },
            quantity: a.quantity,
            price_at_booking: a.price,
          })) || [],
      };
    } catch {
      return null;
    }
  },

  // ===== Payment API =====
  async initiatePayment(
    bookingId: string,
    paymentType: "full" | "deposit" = "deposit"
  ): Promise<{ checkoutUrl: string }> {
    const data = await apiFetch(`/public/bookings/${bookingId}/payment`, {
      method: "POST",
      body: { paymentType },
    });
    return { checkoutUrl: data.checkoutUrl };
  },

  // ===== Helper Functions =====
  parseTime(time: string): number {
    const parts = (time || "").split(":").map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    return hours * 60 + minutes;
  },

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  },

  // ========================================
  // SLOT HOLDS
  // ========================================

  async createSlotHold(
    themeId: string,
    date: string,
    startTime: string,
    endTime: string,
    sessionId: string
  ): Promise<{
    holdId: string;
    themeId: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionId: string;
    expiresAt: string;
    createdAt: string;
  }> {
    const slug = getStudioSlug();
    return apiFetch(`/public/studio/${slug}/holds`, {
      method: "POST",
      body: {
        themeId,
        date,
        startTime,
        endTime,
        sessionId,
      },
    });
  },

  async releaseSlotHold(
    holdId: string,
    sessionId: string
  ): Promise<{ success: boolean }> {
    const slug = getStudioSlug();
    return apiFetch(
      `/public/studio/${slug}/holds/${holdId}?sessionId=${sessionId}`,
      {
        method: "DELETE",
      }
    );
  },

  async getSessionHolds(sessionId: string): Promise<
    Array<{
      holdId: string;
      themeId: string;
      date: string;
      startTime: string;
      endTime: string;
      sessionId: string;
      expiresAt: string;
      createdAt: string;
    }>
  > {
    const slug = getStudioSlug();
    return apiFetch(`/public/studio/${slug}/holds?sessionId=${sessionId}`, {
      method: "GET",
    });
  },
};

// Export convenience functions
export const getStudioBySlug = (slug: string) => api.getStudioBySlug(slug);
export const getThemesByStudio = (studioId: string) =>
  api.getThemesByStudio(studioId);
export const getThemeById = (themeId: string) => api.getThemeById(themeId);
export const getAddonsByStudio = (studioId: string) =>
  api.getAddonsByStudio(studioId);
export const getAvailableTimeSlots = (
  studioId: string,
  themeId: string,
  date: string
) => api.getAvailableTimeSlots(studioId, themeId, date);
export const createBooking = (request: BookingRequest) =>
  api.createBooking(request);
export const getBookingById = async (
  bookingNumber: string
): Promise<Booking> => {
  const booking = await api.getBookingByNumber(bookingNumber);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
};

export const lookupBooking = (bookingNumber: string, phone: string) =>
  api.lookupBooking(bookingNumber, phone);
