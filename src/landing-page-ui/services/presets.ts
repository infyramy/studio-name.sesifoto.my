import type {
  ServicesCategory,
  ServicesPackage,
  ServicesPageConfig,
} from "./types";

const IMG_A =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";
const IMG_B =
  "https://images.unsplash.com/photo-1465495976277-4387d1b1b0ac?q=80&w=800&auto=format&fit=crop";
const IMG_C =
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop";
const IMG_D =
  "https://images.unsplash.com/photo-1520854221256-1748513aa6a8?q=80&w=800&auto=format&fit=crop";
const IMG_E =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";
const IMG_F =
  "https://images.unsplash.com/photo-1606216794074-735e2aa6c74c?q=80&w=800&auto=format&fit=crop";
const IMG_G =
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop";
const IMG_H =
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800&auto=format&fit=crop";

function pkg(
  id: string,
  title: string,
  price: string,
  imageUrl: string,
): ServicesPackage {
  return {
    id,
    imageUrl,
    title,
    price,
    detailLabel: "Pilih",
    detailUrl: "/check-booking",
  };
}

export const DEFAULT_SERVICES_CATEGORIES: ServicesCategory[] = [
  {
    id: "nikah",
    label: "NIKAH",
    columns: 2,
    packages: [
      pkg("nikah-1", "Nikah Sahaja", "RM 450", IMG_A),
      pkg("nikah-2", "Nikah + Video", "RM 850", IMG_B),
    ],
  },
  {
    id: "sanding-resepsi",
    label: "SANDING / RESEPSI",
    columns: 3,
    packages: [
      pkg("sr-1", "Sanding Sahaja", "RM 650", IMG_C),
      pkg("sr-2", "Resepsi Sahaja", "RM 750", IMG_D),
      pkg("sr-3", "Sanding + Resepsi", "RM 1,200", IMG_E),
    ],
  },
  {
    id: "nikah-sanding-1d",
    label: "NIKAH + SANDING (1 DAY)",
    columns: 3,
    packages: [
      pkg("ns1-1", "Basic", "RM 1,500", IMG_F),
      pkg("ns1-2", "Standard", "RM 2,200", IMG_G),
      pkg("ns1-3", "Premium", "RM 3,000", IMG_H),
      pkg("ns1-4", "Platinum", "RM 4,500", IMG_A),
    ],
  },
  {
    id: "tunang",
    label: "TUNANG",
    columns: 3,
    packages: [
      pkg("tunang-1", "Tunang Basic", "RM 350", IMG_B),
      pkg("tunang-2", "Tunang Standard", "RM 550", IMG_C),
      pkg("tunang-3", "Tunang Premium", "RM 750", IMG_D),
    ],
  },
  {
    id: "pre-wedding",
    label: "PRE-WEDDING",
    columns: 3,
    packages: [
      pkg("pw-1", "Studio", "RM 450", IMG_E),
      pkg("pw-2", "Outdoor", "RM 750", IMG_F),
      pkg("pw-3", "Overseas", "RM 2,500", IMG_G),
      pkg("pw-4", "Cinematic", "RM 3,500", IMG_H),
    ],
  },
  {
    id: "nikah-sanding-2d",
    label: "NIKAH + SANDING (2 DAYS)",
    columns: 3,
    packages: [
      pkg("ns2-1", "Basic 2 Hari", "RM 2,500", IMG_A),
      pkg("ns2-2", "Standard 2 Hari", "RM 3,500", IMG_B),
      pkg("ns2-3", "Premium 2 Hari", "RM 5,000", IMG_C),
      pkg("ns2-4", "Platinum 2 Hari", "RM 7,500", IMG_D),
    ],
  },
  {
    id: "outdoor",
    label: "OUTDOOR",
    columns: 3,
    packages: [
      pkg("out-1", "Pantai", "RM 600", IMG_E),
      pkg("out-2", "Taman", "RM 550", IMG_F),
      pkg("out-3", "Gunung", "RM 800", IMG_G),
      pkg("out-4", "Kota", "RM 650", IMG_H),
    ],
  },
];

export function createDefaultServicesConfig(): ServicesPageConfig {
  return {
    pageTemplate: "services",
    sectionLabel: "PILIHAN",
    title: "Pakej & Harga",
    categories: DEFAULT_SERVICES_CATEGORIES.map((cat) => ({
      ...cat,
      packages: cat.packages.map((p) => ({ ...p })),
    })),
    showCta: true,
    ctaImageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
    ctaHeading: "Ceritakan Hari Bahagia Anda Bersama Kami",
    ctaPrimaryLabel: "TEMPAH SEKARANG",
    ctaPrimaryUrl: "/check-booking",
  };
}
