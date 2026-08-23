export type ServicesPackage = {
  id: string;
  imageUrl: string;
  title: string;
  price: string;
  detailLabel: string;
  detailUrl: string;
};

export type ServicesCategory = {
  id: string;
  label: string;
  columns: 2 | 3;
  packages: ServicesPackage[];
};

export type ServicesPageConfig = {
  pageTemplate: "services";
  sectionLabel: string;
  title: string;
  categories: ServicesCategory[];
  showCta: boolean;
  ctaImageUrl: string;
  ctaHeading: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
};

export type ServicesPageConfigInput = Partial<ServicesPageConfig> &
  Record<string, unknown>;
