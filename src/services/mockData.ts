import type { Studio, Theme, Addon, WorkingHours, BlackoutDate, PricingRule, BreakTime, SlotConfiguration, Coupon } from '@/types';

// ============================================================================
// STUDIO DETAILS
// ============================================================================
// Complete studio information including settings, contact details, and branding

export const mockStudios: Record<string, Studio> = {
  najiahstudio: {
    id: 'studio-001',
    slug: 'najiahstudio',
    name: 'Najiah Photography',
    owner_name: 'Siti Najiah',
    whatsapp: '60129876543',
    address: 'No. 12, Jalan Maarof, Bangsar, 59000 Kuala Lumpur, Wilayah Persekutuan',
    instagram: 'https://instagram.com/najiahphotography',
    maps_link: 'https://maps.google.com/?q=Jalan+Maarof+Bangsar+Kuala+Lumpur',
    logo_url: 'https://ui-avatars.com/api/?name=Najiah+Photography&background=0B1215&color=fff&size=200',
    brand_color: '#0B1215',
    default_language: 'BM',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    status: 'active',
    settings: {
      cart_mode_enabled: false,
      cart_hold_duration: 10, // 10 minutes
      deposit_percentage: 50,
      payment_type: 'full', // Deposit only payment
      booking_window_start: '2026-02-01', // Booking starts from February 1, 2026
      booking_window_end: '2026-03-19', // End of Raya booking period
      booking_open: true,
      buffer_minutes: 15,
      auto_cutoff_hours: 0, // Book until slot start time
    },
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2025-01-15T10:30:00Z',
  },
  arisham: {
    id: 'studio-002',
    slug: 'arisham',
    name: 'Arisham Studios',
    owner_name: 'Ahmad Arisham',
    whatsapp: '60123456789',
    address: 'Unit 3-15, Plaza Damas, Jalan Sri Hartamas 1, 50480 Kuala Lumpur',
    instagram: 'https://instagram.com/arishamstudios',
    maps_link: 'https://maps.google.com/?q=Plaza+Damas+Sri+Hartamas+Kuala+Lumpur',
    logo_url: 'https://ui-avatars.com/api/?name=Arisham+Studios&background=FFC8DD&color=000&size=200',
    brand_color: '#FFC8DD',
    default_language: 'EN',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    status: 'active',
    settings: {
      cart_mode_enabled: true,
      cart_hold_duration: 15, // 15 minutes
      deposit_percentage: 50,
      payment_type: 'full', // Full payment required
      booking_window_start: '2026-02-01', // Booking starts from February 1, 2026
      booking_window_end: '2026-03-19', // End of Raya booking period
      booking_open: true,
      buffer_minutes: 10,
      auto_cutoff_hours: 0,
    },
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2025-01-20T14:20:00Z',
  },
};

// ============================================================================
// STUDIO HOMEPAGE CONTENT
// ============================================================================
// Hero section content, branding colors, and marketing copy for each studio

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
    backgroundImage: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.1.0',
    heading: 'Tempah Sesi Fotografi Raya Anda dalam',
    highlightText: '30 Saat',
    testimonial: 'Abadikan detik berharga Raya anda bersama fotografi profesional yang kekal selamanya. Setiap gambar menceritakan kisah kasih sayang keluarga.',
    author: 'Najiah Photography',
    colors: {
      primary: '#A8DADC',
      secondary: '#457B9D',
      accent: '#F1FAEE',
      gradientFrom: '#A8DADC',
      gradientTo: '#457B9D',
    },
  },
  'studio-002': {
    backgroundImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.1.0',
    heading: 'Book Your Raya Photoshoot in',
    highlightText: '30 Seconds',
    testimonial: 'Create timeless memories with professional Raya photography sessions. Every moment captured with elegance and style.',
    author: 'Arisham Studios',
    colors: {
      primary: '#FFC8DD',
      secondary: '#FFAFCC',
      accent: '#BDE0FE',
      gradientFrom: '#FFC8DD',
      gradientTo: '#FFAFCC',
    },
  },
};

// ============================================================================
// STUDIO THEMES
// ============================================================================
// Photography themes/packages available for each studio with pricing and details

export const mockThemes: Record<string, Theme[]> = {
  'studio-001': [
    {
      id: 'theme-001',
      studio_id: 'studio-001',
      name: 'Keluarga Bahagia',
      description_short: 'Sesi foto keluarga dengan backdrop Raya yang meriah',
      description_long: 'Tangkap momen indah bersama keluarga tercinta dalam sesi fotografi profesional dengan tema Raya yang meriah. Termasuk backdrop eksklusif, props Raya tradisional, dan lighting profesional. Sesuai untuk keluarga 3-8 orang. Semua gambar akan diedit dan diserahkan dalam format digital berkualiti tinggi.',
      images: [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1567770809447-22c2e0f6ebb0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
      ],
      base_price: 180,
      base_pax: 5,
      extra_pax_price: 30,
      duration_minutes: 30,
      buffer_minutes: null,
      status: 'active',
      sort_order: 1,
      created_at: '2024-12-05T09:00:00Z',
      updated_at: '2025-01-10T11:15:00Z',
      is_deposit: false,
    },
    {
      id: 'theme-002',
      studio_id: 'studio-001',
      name: 'Couple Raya',
      description_short: 'Sesi foto romantis untuk pasangan dengan konsep elegan',
      description_long: 'Pakej istimewa untuk pasangan yang ingin merakam kenangan Raya bersama. Konsep romantis dan elegan dengan backdrop cantik, lighting lembut, dan props eksklusif. Sesuai untuk pasangan atau pasangan baru. Termasuk 2 perubahan pakaian dan semua gambar diedit dengan teliti.',
      images: [
        'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
      ],
      base_price: 150,
      base_pax: 2,
      extra_pax_price: 40,
      duration_minutes: 20,
      buffer_minutes: null,
      status: 'active',
      sort_order: 2,
      created_at: '2024-12-05T09:00:00Z',
      updated_at: '2025-01-08T14:30:00Z',
      is_deposit: true,
    },
    {
      id: 'theme-003',
      studio_id: 'studio-001',
      name: 'Keluarga VIP',
      description_short: 'Pakej premium untuk keluarga besar dengan sesi yang lebih panjang',
      description_long: 'Pakej eksklusif untuk keluarga besar dengan tempoh sesi yang lebih panjang dan props premium. Termasuk backdrop mewah, makeup touch-up untuk 2 orang, minuman ringan, dan semua gambar diedit profesional. Sesuai untuk keluarga 8-15 orang. Bonus: 5 gambar cetakan 8R dan album digital premium.',
      images: [
        'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1567770809447-22c2e0f6ebb0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
      ],
      base_price: 350,
      base_pax: 8,
      extra_pax_price: 35,
      duration_minutes: 45,
      buffer_minutes: 20,
      status: 'active',
      sort_order: 3,
      created_at: '2024-12-05T09:00:00Z',
      updated_at: '2025-01-12T16:45:00Z',
      is_deposit: false,
    },
  ],
  'studio-002': [
    {
      id: 'theme-004',
      studio_id: 'studio-002',
      name: 'Modern Family',
      description_short: 'Contemporary family photoshoot with modern aesthetics',
      description_long: 'Modern and stylish family photography session with professional lighting and backdrops. Perfect for families who want a contemporary look. Includes modern props, professional editing, and high-resolution digital delivery. Suitable for families of 3-8 people.',
      images: [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
      ],
      base_price: 200,
      base_pax: 5,
      extra_pax_price: 35,
      duration_minutes: 30,
      buffer_minutes: null,
      status: 'active',
      sort_order: 1,
      created_at: '2024-12-10T10:00:00Z',
      updated_at: '2025-01-15T09:20:00Z',
      is_deposit: true,
    },
    {
      id: 'theme-005',
      studio_id: 'studio-002',
      name: 'Elegant Couples',
      description_short: 'Sophisticated couple photography with elegant styling',
      description_long: 'Premium couple photography session with elegant backdrops and sophisticated styling. Perfect for newlyweds or couples celebrating special occasions. Includes professional makeup consultation, multiple backdrop options, and luxury editing.',
      images: [
        'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0',
      ],
      base_price: 180,
      base_pax: 2,
      extra_pax_price: 45,
      duration_minutes: 25,
      buffer_minutes: null,
      status: 'active',
      sort_order: 2,
      created_at: '2024-12-10T10:00:00Z',
      updated_at: '2025-01-18T13:10:00Z',
      is_deposit: true,
    },
  ],
};

// ============================================================================
// STUDIO ADDONS
// ============================================================================
// Additional services and products available for purchase with bookings
// Note: Addons are studio-level but can be mapped to specific themes

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
      image: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-05T09:00:00Z',
    },
    {
      id: 'addon-002',
      studio_id: 'studio-001',
      name: 'Outdoor Shoot +15min',
      price: 80,
      max_quantity: 1,
      status: 'active',
      sort_order: 2,
      image: 'https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-05T09:00:00Z',
    },
    {
      id: 'addon-003',
      studio_id: 'studio-001',
      name: 'Same-day Digital',
      price: 120,
      max_quantity: 1,
      status: 'active',
      sort_order: 3,
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-05T09:00:00Z',
    },
    {
      id: 'addon-004',
      studio_id: 'studio-001',
      name: 'Printed Album',
      price: 200,
      max_quantity: null, // unlimited
      status: 'active',
      sort_order: 4,
      image: 'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-05T09:00:00Z',
    },
    {
      id: 'addon-005',
      studio_id: 'studio-001',
      name: 'Makeup Artist',
      price: 150,
      max_quantity: 2,
      status: 'active',
      sort_order: 5,
      image: 'https://images.unsplash.com/photo-1512496015851-a23fb4659e69?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-05T09:00:00Z',
    },
  ],
  'studio-002': [
    {
      id: 'addon-006',
      studio_id: 'studio-002',
      name: 'Premium Backdrop Set',
      price: 70,
      max_quantity: 1,
      status: 'active',
      sort_order: 1,
      image: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-10T10:00:00Z',
    },
    {
      id: 'addon-007',
      studio_id: 'studio-002',
      name: 'Extended Session +20min',
      price: 100,
      max_quantity: 1,
      status: 'active',
      sort_order: 2,
      image: 'https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-10T10:00:00Z',
    },
    {
      id: 'addon-008',
      studio_id: 'studio-002',
      name: 'Instant Print Package',
      price: 150,
      max_quantity: 1,
      status: 'active',
      sort_order: 3,
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-10T10:00:00Z',
    },
    {
      id: 'addon-009',
      studio_id: 'studio-002',
      name: 'Video Reel (30s)',
      price: 250,
      max_quantity: 1,
      status: 'active',
      sort_order: 4,
      image: 'https://images.unsplash.com/photo-1523450001312-faa4e2e37f0f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-10T10:00:00Z',
    },
    {
      id: 'addon-010',
      studio_id: 'studio-002',
      name: 'Professional Hair Styling',
      price: 120,
      max_quantity: 3,
      status: 'active',
      sort_order: 5,
      image: 'https://images.unsplash.com/photo-1512496015851-a23fb4659e69?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0',
      created_at: '2024-12-10T10:00:00Z',
    },
  ],
};

// ============================================================================
// ADDONS BY THEME MAPPING
// ============================================================================
// Maps which addons are available for each theme
// Structure: { 'studio-id': { 'theme-id': ['addon-id-1', 'addon-id-2'] } }
// If an addon is available for all themes, it should be listed in all theme arrays

export const mockAddonsByTheme: Record<string, Record<string, string[]>> = {
  'studio-001': {
    // Keluarga Bahagia - All addons available
    'theme-001': ['addon-001', 'addon-002', 'addon-003', 'addon-004', 'addon-005'],
    // Couple Raya - Limited addons (no outdoor shoot, no makeup)
    'theme-002': ['addon-001', 'addon-003', 'addon-004'],
    // Keluarga VIP - All addons available (includes makeup)
    'theme-003': ['addon-001', 'addon-002', 'addon-003', 'addon-004', 'addon-005'],
  },
  'studio-002': {
    // Modern Family - All addons available
    'theme-004': ['addon-006', 'addon-007', 'addon-008', 'addon-009', 'addon-010'],
    // Elegant Couples - Premium addons only
    'theme-005': ['addon-006', 'addon-008', 'addon-009', 'addon-010'],
  },
};

// ============================================================================
// WORKING HOURS
// ============================================================================
// Studio operating hours by day of week
// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export const mockWorkingHours: Record<string, WorkingHours[]> = {
  'studio-001': [
    // Sunday (0)
    {
      id: 'wh-001-0',
      studio_id: 'studio-001',
      day_of_week: 0,
      active: true,
      start: '08:00',
      end: '19:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Monday (1)
    {
      id: 'wh-001-1',
      studio_id: 'studio-001',
      day_of_week: 1,
      active: true,
      start: '09:00',
      end: '18:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Tuesday (2)
    {
      id: 'wh-001-2',
      studio_id: 'studio-001',
      day_of_week: 2,
      active: true,
      start: '09:00',
      end: '18:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Wednesday (3)
    {
      id: 'wh-001-3',
      studio_id: 'studio-001',
      day_of_week: 3,
      active: true,
      start: '09:00',
      end: '18:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Thursday (4)
    {
      id: 'wh-001-4',
      studio_id: 'studio-001',
      day_of_week: 4,
      active: true,
      start: '09:00',
      end: '18:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Friday (5) - shorter hours
    {
      id: 'wh-001-5',
      studio_id: 'studio-001',
      day_of_week: 5,
      active: true,
      start: '09:00',
      end: '12:00',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Saturday (6)
    {
      id: 'wh-001-6',
      studio_id: 'studio-001',
      day_of_week: 6,
      active: true,
      start: '08:00',
      end: '19:00',
      created_at: '2024-12-05T09:00:00Z',
    },
  ],
  'studio-002': [
    // Sunday (0)
    {
      id: 'wh-002-0',
      studio_id: 'studio-002',
      day_of_week: 0,
      active: true,
      start: '09:00',
      end: '21:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Monday (1)
    {
      id: 'wh-002-1',
      studio_id: 'studio-002',
      day_of_week: 1,
      active: true,
      start: '10:00',
      end: '20:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Tuesday (2)
    {
      id: 'wh-002-2',
      studio_id: 'studio-002',
      day_of_week: 2,
      active: true,
      start: '10:00',
      end: '20:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Wednesday (3)
    {
      id: 'wh-002-3',
      studio_id: 'studio-002',
      day_of_week: 3,
      active: true,
      start: '10:00',
      end: '20:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Thursday (4)
    {
      id: 'wh-002-4',
      studio_id: 'studio-002',
      day_of_week: 4,
      active: true,
      start: '10:00',
      end: '20:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Friday (5)
    {
      id: 'wh-002-5',
      studio_id: 'studio-002',
      day_of_week: 5,
      active: true,
      start: '10:00',
      end: '20:00',
      created_at: '2024-12-10T10:00:00Z',
    },
    // Saturday (6)
    {
      id: 'wh-002-6',
      studio_id: 'studio-002',
      day_of_week: 6,
      active: true,
      start: '09:00',
      end: '21:00',
      created_at: '2024-12-10T10:00:00Z',
    },
  ],
};

// ============================================================================
// SPECIAL DATES (BLACKOUT DATES)
// ============================================================================
// Dates when studio is closed or unavailable for booking
// Categories: Maintenance, Public Holidays, Special Events, etc.

export const mockBlackoutDates: Record<string, BlackoutDate[]> = {
  'studio-001': [
    // Maintenance
    {
      id: 'blackout-001',
      studio_id: 'studio-001',
      title: 'Studio Maintenance',
      start_date: '2026-02-15',
      end_date: null,
      reason: 'Equipment upgrade and cleaning',
      created_at: '2025-01-05T09:00:00Z',
    },
    // Public Holidays
    {
      id: 'blackout-002',
      studio_id: 'studio-001',
      title: 'Public Holiday - Chinese New Year',
      start_date: '2026-02-08',
      end_date: null,
      reason: 'Public Holiday - Chinese New Year',
      created_at: '2025-01-05T09:00:00Z',
    },
    {
      id: 'blackout-003',
      studio_id: 'studio-001',
      title: 'Public Holiday - Thaipusam',
      start_date: '2026-02-11',
      end_date: null,
      reason: 'Public Holiday - Thaipusam',
      created_at: '2025-01-05T09:00:00Z',
    },
    // Special Events
    {
      id: 'blackout-004',
      studio_id: 'studio-001',
      title: 'Private Event',
      start_date: '2026-03-05',
      end_date: null,
      reason: 'Private Event - Corporate booking',
      created_at: '2025-01-10T14:00:00Z',
    },
  ],
  'studio-002': [
    // Public Holidays
    {
      id: 'blackout-005',
      studio_id: 'studio-002',
      title: 'Public Holiday - Chinese New Year',
      start_date: '2026-02-08',
      end_date: null,
      reason: 'Public Holiday - Chinese New Year',
      created_at: '2025-01-10T10:00:00Z',
    },
    {
      id: 'blackout-006',
      studio_id: 'studio-002',
      title: 'Public Holiday - Thaipusam',
      start_date: '2026-02-11',
      end_date: null,
      reason: 'Public Holiday - Thaipusam',
      created_at: '2025-01-10T10:00:00Z',
    },
    // Maintenance
    {
      id: 'blackout-007',
      studio_id: 'studio-002',
      title: 'Studio Maintenance',
      start_date: '2026-02-20',
      end_date: null,
      reason: 'Backdrop refresh',
      created_at: '2025-01-15T11:00:00Z',
    },
  ],
};

// ============================================================================
// BREAK TIMES
// ============================================================================
// Regular break times (e.g., lunch breaks) that apply to specific days

export const mockBreakTimes: Record<string, BreakTime[]> = {
  'studio-001': [
    {
      id: 'break-001',
      studio_id: 'studio-001',
      name: 'Lunch Break',
      start_time: '13:00',
      end_time: '14:00',
      days_of_week: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      created_at: '2024-12-05T09:00:00Z',
    },
  ],
  'studio-002': [
    {
      id: 'break-002',
      studio_id: 'studio-002',
      name: 'Lunch Break',
      start_time: '13:00',
      end_time: '14:00',
      days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
      created_at: '2024-12-10T10:00:00Z',
    },
  ],
};

// ============================================================================
// SLOT CONFIGURATION
// ============================================================================
// Default slot configuration for each studio

export const mockSlotConfiguration: Record<string, SlotConfiguration> = {
  'studio-001': {
    studio_id: 'studio-001',
    default_duration: 30, // minutes
    buffer_time: 15, // minutes
    max_slots_per_day: 12,
  },
  'studio-002': {
    studio_id: 'studio-002',
    default_duration: 30, // minutes
    buffer_time: 10, // minutes
    max_slots_per_day: 15,
  },
};

// ============================================================================
// SPECIAL PRICING BY DATE
// ============================================================================
// Pricing rules that apply to specific date ranges
// Can be percentage increase or fixed price, and can apply to all themes or specific themes

export const mockPricingRules: Record<string, PricingRule[]> = {
  'studio-001': [
    // Raya Peak Period - Highest demand dates
    {
      id: 'pricing-001',
      studio_id: 'studio-001',
      name: 'Raya Peak Premium Pricing',
      date_range_start: '2026-03-01', // First day of Raya
      date_range_end: '2026-03-03', // Third day of Raya
      rule_type: 'percentage_increase',
      value: 50, // +50% increase
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Pre-Raya Weekend Premium
    {
      id: 'pricing-002',
      studio_id: 'studio-001',
      name: 'Pre-Raya Weekend Premium',
      date_range_start: '2026-02-20',
      date_range_end: '2026-02-28',
      rule_type: 'percentage_increase',
      value: 20, // +20% increase on weekends
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2024-12-05T09:00:00Z',
    },
    // Post-Raya Weekend Premium
    {
      id: 'pricing-003',
      studio_id: 'studio-001',
      name: 'Post-Raya Weekend Premium',
      date_range_start: '2026-03-10',
      date_range_end: '2026-03-19',
      rule_type: 'percentage_increase',
      value: 15, // +15% increase on weekends
      applies_to_themes: ['theme-001', 'theme-002'], // Only for basic themes
      status: 'active',
      created_at: '2025-01-08T10:00:00Z',
    },
  ],
  'studio-002': [
    // Raya Peak Period
    {
      id: 'pricing-004',
      studio_id: 'studio-002',
      name: 'Raya Peak Premium Pricing',
      date_range_start: '2026-03-01',
      date_range_end: '2026-03-03',
      rule_type: 'percentage_increase',
      value: 60, // +60% increase
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2024-12-10T10:00:00Z',
    },
    // February Weekend Premium
    {
      id: 'pricing-005',
      studio_id: 'studio-002',
      name: 'February Weekend Premium',
      date_range_start: '2026-02-01',
      date_range_end: '2026-02-28',
      rule_type: 'percentage_increase',
      value: 25, // +25% increase
      applies_to_themes: 'all',
      status: 'active',
      created_at: '2024-12-10T10:00:00Z',
    },
  ],
};

// ============================================================================
// MOCK BOOKINGS (FOR LOOKUP DEMO)
// ============================================================================
// Sample booking data for testing booking lookup functionality
// These are pre-populated bookings that can be used for testing the success page

import type { Booking } from '@/types';

export const mockBookingsData: Record<string, Booking> = {
  'RY2026-0142': {
    id: 'booking-001',
    studio_id: 'studio-001',
    booking_number: 'RY2026-0142',
    theme_id: 'theme-001',
    theme: mockThemes['studio-001']?.[0]!, // Keluarga Bahagia
    booking_date: '2026-03-02',
    start_time: '10:00',
    end_time: '10:30',
    pax_count: 6,
    customer_name: 'Ahmad Razak',
    customer_phone: '0129876543',
    customer_email: 'ahmad@example.com',
    customer_notes: '',
    consent_tc: true,
    consent_marketing: false,
    base_price: 180, // theme-001 base_price
    extra_pax_fee: 30, // 1 extra pax (6 - 5) × 30
    addons_total: 50,
    special_pricing_applied: 0,
    total_amount: 260, // 180 + 30 + 50
    deposit_amount: 130, // 50% of 260
    balance_amount: 130,
    payment_status: 'deposit_paid',
    booking_status: 'confirmed',
    cart_hold_expires_at: null,
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
    addons: [
      {
        addon: mockAddons['studio-001']?.[0]!, // Set Props Raya
        quantity: 1,
        price_at_booking: 50,
      },
    ],
  },
  'RY2026-0289': {
    id: 'booking-002',
    studio_id: 'studio-001',
    booking_number: 'RY2026-0289',
    theme_id: 'theme-002',
    theme: mockThemes['studio-001']?.[1]!, // Couple Raya
    booking_date: '2026-03-12',
    start_time: '14:00',
    end_time: '14:20',
    pax_count: 4,
    customer_name: 'Siti Nurhaliza',
    customer_phone: '0198765432',
    customer_email: 'siti@example.com',
    customer_notes: 'Please prepare traditional props',
    consent_tc: true,
    consent_marketing: true,
    base_price: 150, // theme-002 base_price
    extra_pax_fee: 80, // 2 extra pax (4 - 2) × 40
    addons_total: 130, // Set Props + Outdoor Shoot
    special_pricing_applied: 0,
    total_amount: 360, // 150 + 80 + 130
    deposit_amount: 180, // 50% of 360
    balance_amount: 180,
    payment_status: 'paid_full',
    booking_status: 'confirmed',
    cart_hold_expires_at: null,
    created_at: '2026-02-15T14:30:00Z',
    updated_at: '2026-02-15T15:00:00Z',
    addons: [
      {
        addon: mockAddons['studio-001']?.[0]!, // Set Props Raya
        quantity: 1,
        price_at_booking: 50,
      },
      {
        addon: mockAddons['studio-001']?.[1]!, // Outdoor Shoot
        quantity: 1,
        price_at_booking: 80,
      },
    ],
  },
  'RY2026-0051': {
    id: 'booking-003',
    studio_id: 'studio-002',
    booking_number: 'RY2026-0051',
    theme_id: 'theme-004',
    theme: mockThemes['studio-002']?.[0]!, // Modern Minimalist
    booking_date: '2026-03-15',
    start_time: '11:00',
    end_time: '11:30',
    pax_count: 2,
    customer_name: 'Ali bin Hassan',
    customer_phone: '0134567890',
    customer_email: 'ali@example.com',
    customer_notes: '',
    consent_tc: true,
    consent_marketing: false,
    base_price: 200, // theme-004 base_price
    extra_pax_fee: 0, // 2 pax is within base_pax of 5
    addons_total: 0,
    special_pricing_applied: 0,
    total_amount: 200,
    deposit_amount: 100, // 50% of 200
    balance_amount: 100,
    payment_status: 'pending',
    booking_status: 'cart_hold',
    cart_hold_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    addons: [],
  },
};

// ============================================================================
// MOCK COUPONS
// ============================================================================
// Discount coupons
export const mockCoupons: Coupon[] = [
  {
    id: 'coupon-001',
    code: 'RAYA2026',
    type: 'percentage',
    value: 10,
    valid_from: '2025-01-01',
    valid_until: '2026-04-01',
    usage_limit: 100,
    usage_count: 5,
    min_spend: 150,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'coupon-002',
    code: 'EARLYBIRD',
    type: 'fixed',
    value: 20,
    valid_from: '2025-01-01',
    valid_until: '2026-02-15',
    usage_limit: 50,
    usage_count: 10,
    min_spend: 100,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'coupon-003',
    code: 'VIPRAYA',
    type: 'percentage',
    value: 20,
    valid_from: '2025-01-01',
    valid_until: '2026-04-01',
    usage_limit: 10,
    usage_count: 2,
    min_spend: 300,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
];
