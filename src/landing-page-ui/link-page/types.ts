export type LinkPageConceptId =
  | "Kampung"
  | "Modern"
  | "Luxury"
  | "Editorial"
  | "Minimalist"
  | "Evergreen"
  | "Analog"
  | "Noir"
  | "Cobalt";

export type LinkPageLayout =
  | "Full Background"
  | "Split Left"
  | "Split Right"
  | "Editorial"
  | "Framed Image"
  | "Portrait Frame";

export type LinkPagePosition =
  | "Top Left"
  | "Top Centre"
  | "Top Right"
  | "Middle Left"
  | "Middle Centre"
  | "Middle Right"
  | "Bottom Left"
  | "Bottom Centre"
  | "Bottom Right";

export type LinkPageAlignment = "Left" | "Centre" | "Right";

export type LinkPageFrame =
  | "Rectangle"
  | "Rounded"
  | "Arch"
  | "Organic"
  | "Circle"
  | "Polaroid"
  | "Widescreen";

export type LinkPageActionLayout =
  | "Floating Card"
  | "Vertical Menu"
  | "Action Tiles"
  | "Bottom Dock"
  | "Minimal Links"
  | "Distributed Actions"
  | "Primary + Menu"
  | "Indexed List";

export type LinkPageContainerSurface =
  | "Solid"
  | "Glass"
  | "Outline"
  | "None";

export type LinkPageSizeScale = "Small" | "Medium" | "Large";
export type LinkPageHeadingSize = "Small" | "Medium" | "Large" | "Display";
export type LinkPageGapScale = "Tight" | "Comfortable" | "Spacious";
export type LinkPageRadiusScale = "None" | "Small" | "Medium" | "Large";
export type LinkPageShadowScale = "None" | "Subtle" | "Elevated";
export type LinkPageBorderScale = "None" | "Subtle" | "Strong";

export type LinkPageNavStyle = "Icon + Text" | "Icon Only" | "Text Links" | "Hidden";
export type LinkPageNavPosition =
  | "Inside Action Box"
  | "Top Left"
  | "Top Centre"
  | "Top Right"
  | "Bottom Centre"
  | "Left Side"
  | "Right Side";

export type LinkPageImageMode = "Single Image" | "Slideshow";
export type LinkPageImageFit = "Cover" | "Contain";

export type LinkPageOverlayType =
  | "None"
  | "Solid"
  | "Bottom Gradient"
  | "Top Gradient"
  | "Vignette";

export type LinkPageDecorationType =
  | "None"
  | "Traditional"
  | "Paper Texture"
  | "Botanical"
  | "Geometric"
  | "Organic";

export type LinkPageButtonShape =
  | "Decorative"
  | "Pill"
  | "Soft Rounded"
  | "Square";

export type LinkPageButtonStyle = "Solid" | "Outline" | "Minimal";
export type LinkPageSecondaryStyle = "Text" | "Outline" | "Soft Fill" | "Solid";
export type LinkPageButtonIconPos = "Leading" | "Trailing" | "None";
export type LinkPageIconStyle = "Outline" | "Solid" | "Duotone";

export type LinkPageLogoDisplay =
  | "Both"
  | "Logo or Studio Name"
  | "Logo Only"
  | "Name Only"
  | "Hidden";

export type LinkPageLogoPosition =
  | "Top Left"
  | "Top Centre"
  | "Top Right"
  | "Above Actions";

export type LinkPageAnnouncementStyle = "Small Text" | "Badge" | "Banner";

export type LinkPageMobileLayout =
  | "Automatic"
  | "Full Background"
  | "Image Above"
  | "Image Below";

export type LinkPageActionId =
  | "book"
  | "check"
  | "location"
  | "call"
  | "price"
  | "services"
  | "portfolio";

export type LinkPageActionPlacement =
  | "Primary Action"
  | "Action Box"
  | "Navigation"
  | "Top Left"
  | "Top Right"
  | "Bottom Left"
  | "Bottom Right";

export type LinkPageActionDisplay = "Icon + Text" | "Icon Only" | "Text Only";

export type LinkPageActionItem = {
  id: LinkPageActionId | string;
  name: string;
  enabled: boolean;
  label: string;
  display: LinkPageActionDisplay;
  placement: LinkPageActionPlacement;
  order: number;
};

export type LinkPageDesignConfig = {
  concept: LinkPageConceptId;
  variation: string;
  layout: LinkPageLayout;
  position: LinkPagePosition;
  alignment: LinkPageAlignment;
  imageWidth: number;
  frame: LinkPageFrame;
  width: "Narrow" | "Standard" | "Wide";
  spacing: LinkPageGapScale;
  pageHeight: "Automatic" | "Full Screen" | "Scroll";
  actionLayout: LinkPageActionLayout;
  actionWidth: "Narrow" | "Standard" | "Wide";
  container: LinkPageContainerSurface;
  containerOpacity: number;
  containerRadius: LinkPageRadiusScale;
  containerShadow: LinkPageShadowScale;
  containerBorder: LinkPageBorderScale;
  actionGap: LinkPageGapScale;
  navigation: LinkPageNavStyle;
  navPosition: LinkPageNavPosition;
  navSize: LinkPageSizeScale;
  navBackground: "Transparent" | "Surface" | "Glass";
  navAlignment: LinkPageAlignment;
  mainImage: string;
  mobileImage: string;
  galleryImages: string[];
  imageMode: LinkPageImageMode;
  imageFit: LinkPageImageFit;
  focusX: number;
  focusY: number;
  mobileFocusX: number;
  mobileFocusY: number;
  slideInterval: number;
  slideTransition: "Fade" | "Slide" | "Crossfade";
  overlay: LinkPageOverlayType;
  overlayColor: string;
  opacity: number;
  decoration: LinkPageDecorationType;
  decorationOpacity: number;
  /** Color palette: primary, background, text, surface, accent, buttonText */
  primary: string;
  background: string;
  text: string;
  surface: string;
  accent: string;
  buttonText: string;
  headingFont: string;
  bodyFont: string;
  headingSize: LinkPageHeadingSize;
  headingWeight: "Regular" | "Medium" | "Semibold" | "Bold";
  bodySize: LinkPageSizeScale;
  bodyWeight: "Regular" | "Medium";
  letterSpacing: "Tight" | "Normal" | "Wide";
  headingCase: "Original" | "Uppercase" | "Lowercase";
  headingStyle: "Normal" | "Italic";
  buttonShape: LinkPageButtonShape;
  buttonStyle: LinkPageButtonStyle;
  secondaryStyle: LinkPageSecondaryStyle;
  buttonSize: LinkPageSizeScale;
  buttonWidth: "Automatic" | "Full Width";
  buttonIcon: LinkPageButtonIconPos;
  iconStyle: LinkPageIconStyle;
  iconSize: LinkPageSizeScale;
  tileShape: "Square" | "Soft Rounded" | "Pill";
  tileShadow: LinkPageShadowScale;
  logoDisplay: LinkPageLogoDisplay;
  logoPosition: LinkPageLogoPosition;
  logoSize: LinkPageSizeScale;
  showName: boolean;
  headline: string;
  showHeadline: boolean;
  subtitle: string;
  showSubtitle: boolean;
  headlineAlignment: "Automatic" | LinkPageAlignment;
  announcement: string;
  showAnnouncement: boolean;
  announcementStyle: LinkPageAnnouncementStyle;
  announcementAlignment: "Automatic" | LinkPageAlignment;
  showPhone: boolean;
  showAddress: boolean;
  mobileLayout: LinkPageMobileLayout;
  mobilePosition: "Automatic" | "Top" | "Centre" | "Bottom";
  mobileAlignment: "Automatic" | LinkPageAlignment;
  mobileImageHeight: "Automatic" | "Compact" | "Tall";
  mobileSticky: boolean;
  animation: "None" | "Subtle Fade" | "Rise Up" | "Slide In";
  showPoweredBy: boolean;
  actions: LinkPageActionItem[];
};
