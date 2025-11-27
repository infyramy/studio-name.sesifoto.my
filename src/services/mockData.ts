import type { Studio, Theme, Addon, WorkingHours, BlackoutDate, PricingRule } from '@/types';

// Mock Studio Data
export const mockStudios: Record<string, Studio> = {
  najiahstudio: {
    id: 'studio-001',
    slug: 'najiahstudio',
    name: 'Najiah Photography',
    owner_name: 'Siti Najiah',
    whatsapp: '0129876543',
    address: 'Jln Maarof, Bangsar, Kuala Lumpur',
    instagram: 'https://instagram.com/najiahphotography',
    maps_link: 'https://maps.google.com/?q=Bangsar+Kuala+Lumpur',
    logo_url: 'https://ui-avatars.com/api/?name=Najiah+Photography',
    brand_color: '#0B1215', // Pastel Mint
    default_language: 'BM',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    status: 'active',
    settings: {
      cart_mode_enabled: false,
      cart_hold_duration: 10, // 10 minutes
      deposit_percentage: 50,
      booking_window_start: null, // Immediate booking allowed
      buffer_minutes: 15,
      auto_cutoff_hours: 0, // Book until slot start time
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
  arisham: {
    id: 'studio-002',
    slug: 'arishamstudios',
    name: 'Arisham Studios',
    owner_name: 'Ahmad Arisham',
    whatsapp: '0123456789',
    address: 'Plaza Damas, Sri Hartamas, KL',
    maps_link: 'https://maps.google.com/?q=Sri+Hartamas+KL',
    logo_url: 'https://ui-avatars.com/api/?name=Arisham+Studios',
    brand_color: '#FFC8DD', // Pastel Rose
    default_language: 'EN',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    status: 'active',
    settings: {
      cart_mode_enabled: true,
      cart_hold_duration: 15,
      deposit_percentage: 50,
      booking_window_start: null,
      buffer_minutes: 10,
      auto_cutoff_hours: 0,
    },
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
  },
};

// Mock Themes for Najiah Studio
export const mockThemes: Record<string, Theme[]> = {
  'studio-001': [
    {
      id: 'theme-001',
      studio_id: 'studio-001',
      name: 'Keluarga Bahagia',
      description_short: 'Sesi foto keluarga dengan backdrop Raya',
      description_long: 'Tangkap momen indah bersama keluarga tercinta dalam sesi fotografi profesional dengan tema Raya yang meriah. Termasuk backdrop eksklusif dan props Raya.',
      images: [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
        'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?w=800',
        'https://images.unsplash.com/photo-1567770809447-22c2e0f6ebb0?w=800',
      ],
      base_price: 180,
      base_pax: 5,
      extra_pax_price: 30,
      duration_minutes: 30,
      buffer_minutes: null,
      status: 'active',
      sort_order: 1,
      created_at: '2025-01-05T00:00:00Z',
      updated_at: '2025-01-05T00:00:00Z',
      is_deposit: false,
    },
    {
      id: 'theme-002',
      studio_id: 'studio-001',
      name: 'Couple Raya',
      description_short: 'Sesi foto romantis untuk pasangan',
      description_long: 'Pakej istimewa untuk pasangan yang ingin merakam kenangan Raya bersama. Konsep romantis dan elegan dengan backdrop cantik.',
      images: [
        'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800',
        'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?w=800',
      ],
      base_price: 150,
      base_pax: 2,
      extra_pax_price: 40,
      duration_minutes: 20,
      buffer_minutes: null,
      status: 'active',
      sort_order: 2,
      created_at: '2025-01-05T00:00:00Z',
      updated_at: '2025-01-05T00:00:00Z',
      is_deposit: true,
    },
    {
      id: 'theme-003',
      studio_id: 'studio-001',
      name: 'Keluarga VIP',
      description_short: 'Pakej premium untuk keluarga besar',
      description_long: 'Pakej eksklusif untuk keluarga besar dengan tempoh sesi yang lebih panjang dan props premium. Termasuk makeup touch-up dan minuman.',
      images: [
        'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
        'https://images.unsplash.com/photo-1567770809447-22c2e0f6ebb0?w=800',
      ],
      base_price: 350,
      base_pax: 8,
      extra_pax_price: 35,
      duration_minutes: 45,
      buffer_minutes: 20,
      status: 'active',
      sort_order: 3,
      created_at: '2025-01-05T00:00:00Z',
      updated_at: '2025-01-05T00:00:00Z',
      is_deposit: false,
    },
  ],
  'studio-002': [
    {
      id: 'theme-004',
      studio_id: 'studio-002',
      name: 'Modern Family',
      description_short: 'Contemporary family photoshoot',
      description_long: 'Modern and stylish family photography session with professional lighting and backdrops.',
      images: [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
      ],
      base_price: 200,
      base_pax: 5,
      extra_pax_price: 35,
      duration_minutes: 30,
      buffer_minutes: null,
      status: 'active',
      sort_order: 1,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z',
      is_deposit: true,
    },
  ],
};

// Mock Add-ons for Najiah Studio
export const mockAddons: Record<string, Addon[]> = {
  'studio-001': [
    {
      id: 'addon-001',
      studio_id: 'studio-001',
      name: 'Set Props Raya',
      price: 50,
      max_quantity: 1,
      status: 'active',
      sort_order: 1,
      created_at: '2025-01-05T00:00:00Z',
    },
    {
      id: 'addon-002',
      studio_id: 'studio-001',
      name: 'Outdoor Shoot +15min',
      price: 80,
      max_quantity: 1,
      status: 'active',
      sort_order: 2,
      created_at: '2025-01-05T00:00:00Z',
    },
    {
      id: 'addon-003',
      studio_id: 'studio-001',
      name: 'Same-day Digital',
      price: 120,
      max_quantity: 1,
      status: 'active',
      sort_order: 3,
      created_at: '2025-01-05T00:00:00Z',
    },
    {
      id: 'addon-004',
      studio_id: 'studio-001',
      name: 'Printed Album',
      price: 200,
      max_quantity: null, // unlimited
      status: 'active',
      sort_order: 4,
      created_at: '2025-01-05T00:00:00Z',
    },
  ],
  'studio-002': [
    {
      id: 'addon-005',
      studio_id: 'studio-002',
      name: 'Premium Backdrop Set',
      price: 70,
      max_quantity: 1,
      status: 'active',
      sort_order: 1,
      created_at: '2025-01-10T00:00:00Z',
    },
    {
      id: 'addon-006',
      studio_id: 'studio-002',
      name: 'Extended Session +20min',
      price: 100,
      max_quantity: 1,
      status: 'active',
      sort_order: 2,
      created_at: '2025-01-10T00:00:00Z',
    },
    {
      id: 'addon-007',
      studio_id: 'studio-002',
      name: 'Instant Print Package',
      price: 150,
      max_quantity: 1,
      status: 'active',
      sort_order: 3,
      created_at: '2025-01-10T00:00:00Z',
    },
    {
      id: 'addon-008',
      studio_id: 'studio-002',
      name: 'Video Reel (30s)',
      price: 250,
      max_quantity: 1,
      status: 'active',
      sort_order: 4,
      created_at: '2025-01-10T00:00:00Z',
    },
  ],
};

// Mock Working Hours (Syawal period)
export const mockWorkingHours: Record<string, WorkingHours[]> = {
  'studio-001': [
    // Monday - Thursday
    ...[1, 2, 3, 4].map((day) => ({
      id: `wh-${day}`,
      studio_id: 'studio-001',
      day_of_week: day,
      time_windows: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
      created_at: '2025-01-05T00:00:00Z',
    })),
    // Friday
    {
      id: 'wh-5',
      studio_id: 'studio-001',
      day_of_week: 5,
      time_windows: [{ start: '09:00', end: '12:00' }],
      created_at: '2025-01-05T00:00:00Z',
    },
    // Saturday - Sunday
    ...[6, 0].map((day) => ({
      id: `wh-${day}`,
      studio_id: 'studio-001',
      day_of_week: day,
      time_windows: [
        { start: '08:00', end: '13:00' },
        { start: '15:00', end: '19:00' },
      ],
      created_at: '2025-01-05T00:00:00Z',
    })),
  ],
  'studio-002': [
    // Monday - Friday
    ...[1, 2, 3, 4, 5].map((day) => ({
      id: `wh-arisham-${day}`,
      studio_id: 'studio-002',
      day_of_week: day,
      time_windows: [
        { start: '10:00', end: '13:00' },
        { start: '14:00', end: '20:00' },
      ],
      created_at: '2025-01-10T00:00:00Z',
    })),
    // Saturday - Sunday
    ...[6, 0].map((day) => ({
      id: `wh-arisham-${day}`,
      studio_id: 'studio-002',
      day_of_week: day,
      time_windows: [
        { start: '09:00', end: '21:00' },
      ],
      created_at: '2025-01-10T00:00:00Z',
    })),
  ],
};

// Mock Blackout Dates
export const mockBlackoutDates: Record<string, BlackoutDate[]> = {
  'studio-001': [
    {
      id: 'blackout-001',
      studio_id: 'studio-001',
      date: '2025-10-30', // Studio closed for maintenance
      reason: 'Studio Maintenance',
      created_at: '2025-01-05T00:00:00Z',
    },
    {
      id: 'blackout-002',
      studio_id: 'studio-001',
      date: '2025-11-01', // Public holiday
      reason: 'Public Holiday',
      created_at: '2025-01-05T00:00:00Z',
    },
  ],
  'studio-002': [
    {
      id: 'blackout-003',
      studio_id: 'studio-002',
      date: '2025-11-01', // Public holiday
      reason: 'Public Holiday',
      created_at: '2025-01-10T00:00:00Z',
    },
  ],
};

// Mock Pricing Rules
export const mockPricingRules: Record<string, PricingRule[]> = {
  'studio-001': [
    {
      id: 'pricing-001',
      studio_id: 'studio-001',
      name: 'Raya Special +50%',
      date_range_start: '2025-11-02',
      date_range_end: '2025-11-04',
      rule_type: 'percentage_increase',
      value: 50, // +50%
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2025-01-05T00:00:00Z',
    },
    {
      id: 'pricing-002',
      studio_id: 'studio-001',
      name: 'Weekend Premium +20%',
      date_range_start: '2025-10-25',
      date_range_end: '2025-10-31',
      rule_type: 'percentage_increase',
      value: 20, // +20% on weekends
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2025-01-05T00:00:00Z',
    },
  ],
  'studio-002': [
    {
      id: 'pricing-003',
      studio_id: 'studio-002',
      name: 'Raya Peak Premium +60%',
      date_range_start: '2025-11-02',
      date_range_end: '2025-11-04',
      rule_type: 'percentage_increase',
      value: 60, // +60%
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2025-01-10T00:00:00Z',
    },
  ],
};

// Mock Homepage Hero Content
export const mockHeroContent: Record<string, {
  backgroundImage: string;
  heading: string;
  highlightText: string;
  testimonial: string;
  author: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradientFrom: string;
    gradientTo: string;
  };
}> = {
  'studio-001': {
    backgroundImage: 'https://www.whiteroomstudio.com.sg/wordpress/wp-content/uploads/2023/03/Family-Portrait-Hari-Raya-Photoshoot-Singapore-4-scaled.jpg',
    heading: 'Tempah Sesi Fotografi Raya Anda dalam',
    highlightText: '30 Saat',
    testimonial: 'Abadikan detik berharga Raya anda bersama fotografi profesional yang kekal selamanya.',
    author: 'Najiah Photography',
    colors: {
      primary: '#A8DADC',      // Pastel Mint
      secondary: '#457B9D',    // Blue
      accent: '#F1FAEE',       // Off White
      gradientFrom: '#A8DADC', // Mint
      gradientTo: '#457B9D'    // Blue
    }
  },
  'studio-002': {
    backgroundImage: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1600',
    heading: 'Book Your Raya Photoshoot in',
    highlightText: '30 Seconds',
    testimonial: 'Create timeless memories with professional Raya photography sessions.',
    author: 'Arisham Studios',
    colors: {
      primary: '#FFC8DD',      // Pastel Rose
      secondary: '#FFAFCC',    // Pink
      accent: '#BDE0FE',       // Light Blue
      gradientFrom: '#FFC8DD', // Rose
      gradientTo: '#FFAFCC'    // Pink
    }
  }
};

// Mock Bookings for lookup demo
export const mockBookingsData: Record<string, any> = {
  'RY2026-0142': {
    id: 'booking-001',
    booking_number: 'RY2026-0142',
    studio_id: 'studio-001',
    theme: mockThemes['studio-001']?.[0], // Keluarga Bahagia
    selectedDate: '2025-11-03',
    selectedSlot: {
      time: '10:00 - 10:30',
      start: '10:00',
      end: '10:30'
    },
    pax: 6,
    customerInfo: {
      name: 'Ahmad Razak',
      whatsapp: '0129876543',
      email: 'ahmad@example.com',
    },
    selectedAddons: [
      {
        id: 'addon-001',
        name: 'Set Props Raya',
        price: 50,
      }
    ],
    totalPrice: 240,
    depositAmount: 120,
    balanceAmount: 120,
    status: 'confirmed',
    paymentStatus: 'deposit_paid',
    createdAt: '2025-10-20T10:00:00Z',
  }
};
