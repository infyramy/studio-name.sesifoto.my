// Studio Types
export interface Studio {
  id: string;
  slug: string;
  name: string;
  owner_name: string;
  whatsapp: string;
  instagram?: string;
  address: string;
  maps_link: string;
  logo_url: string;
  brand_color: string;
  default_language: 'BM' | 'EN';
  timezone: string;
  currency: string;
  status: 'trial' | 'active' | 'suspended';
  settings: StudioSettings;
  created_at: string;
  updated_at: string;
}

export interface StudioSettings {
  cart_mode_enabled: boolean;
  cart_hold_duration: number; // minutes
  deposit_percentage: number; // 50 for 50%
  payment_type: 'deposit' | 'full'; // 'deposit' = deposit only, 'full' = full payment required
  booking_window_start: string | null; // ISO date or null for immediate
  buffer_minutes: number; // default buffer between slots
  auto_cutoff_hours: number; // 0 for slot start time
}

// Theme Types
export interface Theme {
  id: string;
  studio_id: string;
  name: string;
  description_short: string;
  description_long: string;
  images: string[];
  base_price: number;
  base_pax: number;
  extra_pax_price: number;
  duration_minutes: number;
  buffer_minutes: number | null; // null uses studio default
  status: 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
  is_deposit?: boolean; // Display-only flag to mark price as deposit
}

// Working Hours Types
export interface WorkingHours {
  id: string;
  studio_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  time_windows: TimeWindow[];
  applies_to_date_range?: DateRange;
  created_at: string;
}

export interface TimeWindow {
  start: string; // "09:00"
  end: string;   // "12:00"
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// Blackout Dates
export interface BlackoutDate {
  id: string;
  studio_id: string;
  date: string; // YYYY-MM-DD
  reason: string;
  created_at: string;
}

// Pricing Rules
export interface PricingRule {
  id: string;
  studio_id: string;
  name: string;
  date_range_start: string; // YYYY-MM-DD
  date_range_end: string;   // YYYY-MM-DD
  rule_type: 'percentage_increase' | 'fixed_price';
  value: number; // 50 for +50% or 280 for RM280
  applies_to_themes: string[] | 'all';
  status: 'active' | 'inactive';
  created_at: string;
}

// Add-ons
export interface Addon {
  id: string;
  studio_id: string;
  name: string;
  price: number;
  max_quantity: number | null; // null = unlimited
  status: 'active' | 'inactive';
  sort_order: number;
  image?: string; // Optional image URL
  created_at: string;
}

// Slot Types
export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "09:30"
  status: 'available' | 'booked' | 'held';
  price: number;
  is_special_pricing: boolean;
  special_pricing_label?: string; // "Harga Istimewa Raya"
}

export interface DateSlotInfo {
  date: string; // YYYY-MM-DD
  status: 'available' | 'fully_booked' | 'blackout' | 'special_pricing';
  slots_available: number;
  slots_total: number;
  special_pricing_label?: string;
}

// Booking Types
export interface BookingRequest {
  theme_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // "09:00"
  end_time: string;     // "09:30"
  pax_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_notes?: string;
  consent_tc: boolean;
  consent_marketing: boolean;
  selected_addons: SelectedAddon[];
}

export interface SelectedAddon {
  addon_id: string;
  quantity: number;
}

export interface Booking {
  id: string;
  studio_id: string;
  booking_number: string; // "RY2026-0142"
  theme_id: string;
  theme: Theme;
  booking_date: string;
  start_time: string;
  end_time: string;
  pax_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_notes: string;
  consent_tc: boolean;
  consent_marketing: boolean;
  base_price: number;
  extra_pax_fee: number;
  addons_total: number;
  special_pricing_applied: number;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  payment_status: 'pending' | 'deposit_paid' | 'paid_full' | 'refunded';
  booking_status: 'cart_hold' | 'confirmed' | 'completed' | 'cancelled';
  cart_hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
  addons: BookingAddon[];
}

export interface BookingAddon {
  addon: Addon;
  quantity: number;
  price_at_booking: number;
}

// Cart Types
export interface CartItem {
  theme_id: string;
  theme: Theme;
  booking_date: string;
  start_time: string;
  end_time: string;
  pax_count: number;
  selected_addons: SelectedAddon[];
  base_price: number;
  extra_pax_fee: number;
  addons_total: number;
  special_pricing_applied: number;
  total_amount: number;
}

// Payment Types
export interface PaymentRequest {
  booking_id: string;
  amount: number;
  payment_method: 'FPX' | 'card' | 'ewallet';
}

export interface PaymentResponse {
  payment_id: string;
  payment_url: string; // Redirect to CHIP gateway
  expires_at: string;
}

// Language Types
export type Language = 'BM' | 'EN';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}
