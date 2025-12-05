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
  BookingAddon,
  Coupon,
} from '@/types';
import {
  mockStudios,
  mockThemes,
  mockAddons,
  mockWorkingHours,
  mockBlackoutDates,
  mockPricingRules,
  mockBookingsData,
  mockBreakTimes,
  mockSlotConfiguration,
  mockCoupons,
} from './mockData';

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory bookings storage for demo
const mockBookings: Record<string, Booking> = {};

// API Service
export const api = {
  // ===== Studio APIs =====
  async getStudioBySlug(slug: string): Promise<Studio> {
    await delay(300); // Simulate network delay

    const studio = mockStudios[slug];
    if (!studio) {
      throw new Error('Studio not found');
    }

    return studio;
  },

  // Check if studio exists (lightweight check)
  studioExists(slug: string): boolean {
    return !!mockStudios[slug];
  },

  // ===== Theme APIs =====
  async getThemesByStudio(studioId: string): Promise<Theme[]> {
    await delay(200);

    return mockThemes[studioId] || [];
  },

  async getThemeById(themeId: string): Promise<Theme | null> {
    await delay(200);

    // Search through all studio themes
    for (const themes of Object.values(mockThemes)) {
      const theme = themes.find((t) => t.id === themeId);
      if (theme) return theme;
    }

    return null;
  },

  // ===== Add-ons APIs =====
  async getAddonsByStudio(studioId: string): Promise<Addon[]> {
    await delay(200);

    return mockAddons[studioId] || [];
  },

  async getAddonById(addonId: string): Promise<Addon | null> {
    await delay(100);
    // Search through all studios' addons
    for (const studioAddons of Object.values(mockAddons)) {
      const addon = studioAddons.find(a => a.id === addonId);
      if (addon) return addon;
    }
    return null;
  },

  // ===== Working Hours APIs =====
  async getWorkingHours(studioId: string): Promise<WorkingHours[]> {
    await delay(200);

    return mockWorkingHours[studioId] || [];
  },

  // ===== Blackout Dates APIs =====
  async getBlackoutDates(studioId: string): Promise<BlackoutDate[]> {
    await delay(200);

    return mockBlackoutDates[studioId] || [];
  },

  // ===== Pricing Rules APIs =====
  async getPricingRules(studioId: string): Promise<PricingRule[]> {
    await delay(200);

    return mockPricingRules[studioId] || [];
  },

  // ===== Slot Availability APIs =====
  async getAvailableDates(
    studioId: string,
    themeId: string,
    startDate: string,
    endDate: string
  ): Promise<DateSlotInfo[]> {
    await delay(300);

    // Mock implementation: Generate date info for date range
    const dates: DateSlotInfo[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get blackout dates for this studio
    const blackouts = mockBlackoutDates[studioId] || [];
    const blackoutDateStrings = blackouts.map((b) => b.date);

    // Get pricing rules for special dates
    const pricingRules = mockPricingRules[studioId] || [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      // Check if blackout - handle both single date and date range
      const isBlackout = blackouts.some((blackout) => {
        if (!blackout.end_date) {
          return dateString === blackout.start_date;
        }
        return dateString >= blackout.start_date && dateString <= blackout.end_date;
      });
      
      if (isBlackout) {
        dates.push({
          date: dateString,
          status: 'blackout',
          slots_available: 0,
          slots_total: 0,
        });
        continue;
      }

      // Check for special pricing
      let specialPricing = false;
      let specialLabel = '';

      for (const rule of pricingRules) {
        if (dateString >= rule.date_range_start && dateString <= rule.date_range_end) {
          specialPricing = true;
          specialLabel = rule.name;
          break;
        }
      }

      // Check for weekend pricing
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Simulate slot availability (random for demo)
      const totalSlots = Math.floor(Math.random() * 10) + 8; // 8-18 slots
      const availableSlots = Math.floor(Math.random() * totalSlots);

      dates.push({
        date: dateString,
        status:
          availableSlots === 0
            ? 'fully_booked'
            : specialPricing || isWeekend
            ? 'special_pricing'
            : 'available',
        slots_available: availableSlots,
        slots_total: totalSlots,
        special_pricing_label: specialPricing ? specialLabel : undefined,
      });
    }

    return dates;
  },

  async getAvailableTimeSlots(
    studioId: string,
    themeId: string,
    date: string
  ): Promise<TimeSlot[]> {
    await delay(300);

    const theme = await this.getThemeById(themeId);
    if (!theme) return [];

    const workingHours = mockWorkingHours[studioId] || [];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Find working hours for this day
    const dayHours = workingHours.find((wh) => wh.day_of_week === dayOfWeek);
    if (!dayHours || !dayHours.active) return [];

    // Get break times for this day
    const breakTimes = (mockBreakTimes[studioId] || []).filter(
      (bt) => bt.days_of_week.includes(dayOfWeek)
    );

    // Generate time slots
    const slots: TimeSlot[] = [];
    const duration = theme.duration_minutes;
    const buffer = theme.buffer_minutes || 15; // Use theme buffer or default
    const slotInterval = duration + buffer;

    let currentTime = this.parseTime(dayHours.start);
    const endTime = this.parseTime(dayHours.end);

    while (currentTime < endTime) {
      const slotEnd = currentTime + duration;

      // Only add if slot ends before day ends
      if (slotEnd <= endTime) {
        const startStr = this.formatTime(currentTime);
        const endStr = this.formatTime(slotEnd);

        // Check if slot overlaps with any break time
        const overlapsBreak = breakTimes.some((bt) => {
          const breakStart = this.parseTime(bt.start_time);
          const breakEnd = this.parseTime(bt.end_time);
          // Slot overlaps if it starts before break ends and ends after break starts
          return currentTime < breakEnd && slotEnd > breakStart;
        });

        // Skip slots that overlap with break times
        if (!overlapsBreak) {
          // Simulate random availability (for demo)
          const isBooked = Math.random() > 0.7; // 30% chance of being booked

          // Check for special pricing
          const pricingRules = mockPricingRules[studioId] || [];
          let price = theme.base_price;
          let isSpecialPricing = false;

          for (const rule of pricingRules) {
            if (rule.status === 'active' && date >= rule.date_range_start && date <= rule.date_range_end) {
              if (rule.rule_type === 'percentage_increase') {
                price = price * (1 + rule.value / 100);
              } else if (rule.rule_type === 'fixed_price') {
                price = rule.value;
              }
              isSpecialPricing = true;
              break;
            }
          }

          slots.push({
            start: startStr,
            end: endStr,
            status: isBooked ? 'booked' : 'available',
            price: Math.round(price),
            is_special_pricing: isSpecialPricing,
            special_pricing_label: isSpecialPricing ? '*' : undefined,
          });
        }
      }

      currentTime += slotInterval;
    }

    return slots;
  },

  // ===== Coupon APIs =====
  async validateCoupon(code: string): Promise<Coupon> {
    await delay(300);

    const coupon = mockCoupons.find(
      (c) => c.code === code && c.status === 'active'
    );

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    // Check validity dates
    const today = new Date().toISOString().split('T')[0];
    if (coupon.valid_from && today < coupon.valid_from) {
      throw new Error('Coupon not yet valid');
    }
    if (coupon.valid_until && today > coupon.valid_until) {
      throw new Error('Coupon expired');
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      throw new Error('Coupon usage limit reached');
    }

    return coupon;
  },

  // ===== Booking APIs =====
  async createBooking(request: BookingRequest): Promise<Booking> {
    await delay(500);

    // Mock booking creation
    const theme = await this.getThemeById(request.theme_id);
    if (!theme) throw new Error('Theme not found');

    const bookingNumber = `RY2026-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    // Process addons
    const bookingAddons: BookingAddon[] = [];
    let addonsTotal = 0;

    for (const selectedAddon of request.selected_addons) {
      const addon = await this.getAddonById(selectedAddon.addon_id);
      if (addon) {
        const addonTotal = addon.price * selectedAddon.quantity;
        addonsTotal += addonTotal;
        bookingAddons.push({
          addon: addon,
          quantity: selectedAddon.quantity,
          price_at_booking: addon.price
        });
      }
    }

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      studio_id: theme.studio_id,
      booking_number: bookingNumber,
      theme_id: request.theme_id,
      theme: theme,
      booking_date: request.booking_date,
      start_time: request.start_time,
      end_time: request.end_time,
      pax_count: request.pax_count,
      customer_name: request.customer_name,
      customer_phone: request.customer_phone,
      customer_email: request.customer_email,
      customer_notes: request.customer_notes || '',
      consent_tc: request.consent_tc,
      consent_marketing: request.consent_marketing,
      base_price: theme.base_price,
      extra_pax_fee: Math.max(0, request.pax_count - theme.base_pax) * theme.extra_pax_price,
      addons_total: addonsTotal,
      special_pricing_applied: 0, // Calculate from pricing rules
      coupon_code: request.coupon_code,
      discount_amount: request.discount_amount || 0,
      total_amount: 0, // Will be calculated
      deposit_amount: 0, // 50% of total
      balance_amount: 0, // Remaining 50%
      payment_status: 'pending',
      booking_status: 'cart_hold',
      cart_hold_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      addons: bookingAddons,
    };

    // Calculate totals
    const subtotal = booking.base_price + booking.extra_pax_fee + booking.addons_total;
    booking.total_amount = Math.max(0, subtotal - (booking.discount_amount || 0));
    booking.deposit_amount = Math.round(booking.total_amount * 0.5);
    booking.balance_amount = booking.total_amount - booking.deposit_amount;

    // Store in mock storage (keyed by booking_number for lookup)
    mockBookings[bookingNumber] = booking;

    return booking;
  },

  async getBookingByIdAndPhone(bookingId: string, phone: string): Promise<Booking | null> {
    await delay(300);

    const booking = mockBookings[bookingId];
    if (!booking) return null;

    // Verify phone matches
    const normalizedInputPhone = phone.replace(/[\s-]/g, '');
    const normalizedBookingPhone = booking.customer_phone.replace(/[\s-]/g, '');

    if (normalizedInputPhone !== normalizedBookingPhone) {
      return null;
    }

    return booking;
  },

  // ===== Helper Functions =====
  parseTime(time: string): number {
    // Convert "09:00" to minutes from midnight (540)
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  formatTime(minutes: number): string {
    // Convert minutes from midnight to "09:00" format
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  },
};

// Export convenience functions
export const getStudioBySlug = (slug: string) => api.getStudioBySlug(slug);
export const getThemesByStudio = (studioId: string) => api.getThemesByStudio(studioId);
export const getThemeById = (themeId: string) => api.getThemeById(themeId);
export const getAddonsByStudio = (studioId: string) => api.getAddonsByStudio(studioId);
export const getAvailableTimeSlots = (studioId: string, themeId: string, date: string) =>
  api.getAvailableTimeSlots(studioId, themeId, date);
export const createBooking = (request: BookingRequest) => api.createBooking(request);
export const getBookingById = (bookingId: string) => {
  // bookingId is actually the booking_number from the URL
  // Check in-memory bookings first (from actual bookings made, keyed by booking_number)
  let booking = mockBookings[bookingId];

  // If not found, check mock demo data
  if (!booking) {
    const mockBooking = mockBookingsData[bookingId];
    if (mockBooking) {
      // Convert mock booking data to Booking type if needed
      // For now, just return it as-is (it should match the structure)
      booking = mockBooking as Booking;
    }
  }

  if (!booking) throw new Error('Booking not found');
  return Promise.resolve(booking);
};
