export type PortfolioCategory = {
  id: string;
  label: string;
};

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  categoryId: string;
};

export type PortfolioPageConfig = {
  pageTemplate: "portfolio";
  sectionLabel: string;
  title: string;
  subtitle: string;
  featuredImageUrl: string;
  categories: PortfolioCategory[];
  items: PortfolioItem[];
  showCta: boolean;
  ctaImageUrl: string;
  ctaSectionLabel: string;
  ctaHeading: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
};

export type PortfolioPageConfigInput = Partial<PortfolioPageConfig> &
  Record<string, unknown>;
