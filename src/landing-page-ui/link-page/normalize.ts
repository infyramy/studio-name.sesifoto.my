import { safeHttpUrl } from "../useLandingPageStyles";
import {
  createDefaultLinkPageDesign,
  DEFAULT_LINK_ACTIONS,
  LINK_PAGE_CONCEPTS,
} from "./presets";
import type {
  LinkPageActionDisplay,
  LinkPageActionItem,
  LinkPageActionLayout,
  LinkPageActionPlacement,
  LinkPageAlignment,
  LinkPageButtonIconPos,
  LinkPageButtonShape,
  LinkPageButtonStyle,
  LinkPageConceptId,
  LinkPageContainerSurface,
  LinkPageDecorationType,
  LinkPageDesignConfig,
  LinkPageFrame,
  LinkPageLayout,
  LinkPageLogoDisplay,
  LinkPageLogoPosition,
  LinkPageMobileLayout,
  LinkPageNavPosition,
  LinkPageNavStyle,
  LinkPageOverlayType,
  LinkPagePosition,
  LinkPageSecondaryStyle,
} from "./types";

const HEX_RE = /^#[0-9a-f]{6}$/i;

function pickOne<T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof val === "string" && (allowed as readonly string[]).includes(val)) {
    return val as T;
  }
  return fallback;
}

function numRange(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val === "string" && val.endsWith("%")) {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return Math.min(max, Math.max(min, parsed));
  }
  if (typeof val === "number" && Number.isFinite(val)) {
    return Math.min(max, Math.max(min, val));
  }
  return fallback;
}

function strVal(val: unknown, fallback: string, maxLen = 200): string {
  if (typeof val !== "string") return fallback;
  return val.trim().slice(0, maxLen);
}

function hexVal(val: unknown, fallback: string): string {
  if (typeof val === "string" && HEX_RE.test(val.trim())) {
    return val.trim().toUpperCase();
  }
  return fallback;
}

function boolVal(val: unknown, fallback: boolean): boolean {
  if (typeof val === "boolean") return val;
  if (val === "true" || val === 1) return true;
  if (val === "false" || val === 0) return false;
  return fallback;
}

function normalizeActions(
  input: unknown,
  defaults: LinkPageActionItem[],
): LinkPageActionItem[] {
  if (!Array.isArray(input) || input.length === 0) return defaults;

  const validDisplays: LinkPageActionDisplay[] = [
    "Icon + Text",
    "Icon Only",
    "Text Only",
  ];
  const validPlacements: LinkPageActionPlacement[] = [
    "Primary Action",
    "Action Box",
    "Navigation",
    "Top Left",
    "Top Right",
    "Bottom Left",
    "Bottom Right",
  ];

  const result: LinkPageActionItem[] = [];
  for (let i = 0; i < input.length; i++) {
    const row = input[i];
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const name = strVal(item.name, "", 60);
    const id =
      strVal(item.id, "", 32) ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      `action-${i + 1}`;
    const def = defaults.find((d) => d.id === id || d.name === name);

    result.push({
      id: def?.id ?? id,
      name: name || def?.name || "Action",
      enabled:
        id === "book" ? true : boolVal(item.enabled, def?.enabled ?? true),
      label: strVal(item.label, def?.label ?? (name || "Action"), 40),
      display: pickOne(item.display, validDisplays, def?.display ?? "Icon + Text"),
      placement: pickOne(
        item.placement,
        validPlacements,
        def?.placement ?? (i === 0 ? "Primary Action" : "Action Box"),
      ),
      order:
        typeof item.order === "number"
          ? item.order
          : typeof item.order === "string"
            ? parseInt(item.order, 10) || i + 1
            : i + 1,
    });
  }

  return result.length > 0 ? result.sort((a, b) => a.order - b.order) : defaults;
}

export function normalizeLinkPageDesignConfig(
  input: unknown,
): LinkPageDesignConfig {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const concept = pickOne<LinkPageConceptId>(
    raw.concept,
    LINK_PAGE_CONCEPTS.map((c) => c.id),
    "Kampung",
  );
  const d = createDefaultLinkPageDesign(concept);

  const layouts: LinkPageLayout[] = [
    "Full Background",
    "Split Left",
    "Split Right",
    "Editorial",
    "Framed Image",
    "Portrait Frame",
  ];
  const positions: LinkPagePosition[] = [
    "Top Left",
    "Top Centre",
    "Top Right",
    "Middle Left",
    "Middle Centre",
    "Middle Right",
    "Bottom Left",
    "Bottom Centre",
    "Bottom Right",
  ];
  const alignments: LinkPageAlignment[] = ["Left", "Centre", "Right"];
  const frames: LinkPageFrame[] = [
    "Rectangle",
    "Rounded",
    "Arch",
    "Organic",
    "Circle",
  ];
  const actionLayouts: LinkPageActionLayout[] = [
    "Floating Card",
    "Vertical Menu",
    "Action Tiles",
    "Bottom Dock",
    "Minimal Links",
    "Distributed Actions",
    "Primary + Menu",
  ];
  const containers: LinkPageContainerSurface[] = [
    "Solid",
    "Glass",
    "Outline",
    "None",
  ];
  const navStyles: LinkPageNavStyle[] = [
    "Icon + Text",
    "Icon Only",
    "Text Links",
    "Hidden",
  ];
  const navPositions: LinkPageNavPosition[] = [
    "Inside Action Box",
    "Top Left",
    "Top Centre",
    "Top Right",
    "Bottom Centre",
    "Left Side",
    "Right Side",
  ];
  const overlays: LinkPageOverlayType[] = [
    "None",
    "Solid",
    "Bottom Gradient",
    "Top Gradient",
    "Vignette",
  ];
  const decorations: LinkPageDecorationType[] = [
    "None",
    "Traditional",
    "Paper Texture",
    "Botanical",
    "Geometric",
    "Organic",
  ];
  const buttonShapes: LinkPageButtonShape[] = [
    "Decorative",
    "Pill",
    "Soft Rounded",
    "Square",
  ];
  const buttonStyles: LinkPageButtonStyle[] = ["Solid", "Outline", "Minimal"];
  const secondaryStyles: LinkPageSecondaryStyle[] = [
    "Text",
    "Outline",
    "Soft Fill",
    "Solid",
  ];
  const buttonIcons: LinkPageButtonIconPos[] = ["Leading", "Trailing", "None"];
  const logoDisplays: LinkPageLogoDisplay[] = [
    "Both",
    "Logo or Studio Name",
    "Logo Only",
    "Name Only",
    "Hidden",
  ];
  const logoPositions: LinkPageLogoPosition[] = [
    "Top Left",
    "Top Centre",
    "Top Right",
    "Above Actions",
  ];
  const mobileLayouts: LinkPageMobileLayout[] = [
    "Automatic",
    "Full Background",
    "Image Above",
    "Image Below",
  ];

  const galleryImages = Array.isArray(raw.galleryImages)
    ? raw.galleryImages
        .map((u) => safeHttpUrl(u))
        .filter((u): u is string => Boolean(u))
        .slice(0, 12)
    : [];

  return {
    concept,
    variation: strVal(raw.variation, d.variation, 40),
    layout: pickOne(raw.layout, layouts, d.layout),
    position: pickOne(raw.position, positions, d.position),
    alignment: pickOne(raw.alignment, alignments, d.alignment),
    imageWidth: numRange(raw.imageWidth, 30, 100, d.imageWidth),
    frame: pickOne(raw.frame, frames, d.frame),
    width: pickOne(raw.width, ["Narrow", "Standard", "Wide"], d.width),
    spacing: pickOne(raw.spacing, ["Tight", "Comfortable", "Spacious"], d.spacing),
    pageHeight: pickOne(
      raw.pageHeight,
      ["Automatic", "Full Screen", "Scroll"],
      d.pageHeight,
    ),
    actionLayout: pickOne(raw.actionLayout, actionLayouts, d.actionLayout),
    actionWidth: pickOne(
      raw.actionWidth,
      ["Narrow", "Standard", "Wide"],
      d.actionWidth,
    ),
    container: pickOne(raw.container, containers, d.container),
    containerOpacity: numRange(raw.containerOpacity, 0, 100, d.containerOpacity),
    containerRadius: pickOne(
      raw.containerRadius,
      ["None", "Small", "Medium", "Large"],
      d.containerRadius,
    ),
    containerShadow: pickOne(
      raw.containerShadow,
      ["None", "Subtle", "Elevated"],
      d.containerShadow,
    ),
    containerBorder: pickOne(
      raw.containerBorder,
      ["None", "Subtle", "Strong"],
      d.containerBorder,
    ),
    actionGap: pickOne(
      raw.actionGap,
      ["Tight", "Comfortable", "Spacious"],
      d.actionGap,
    ),
    navigation: pickOne(raw.navigation, navStyles, d.navigation),
    navPosition: pickOne(raw.navPosition, navPositions, d.navPosition),
    navSize: pickOne(raw.navSize, ["Small", "Medium", "Large"], d.navSize),
    navBackground: pickOne(
      raw.navBackground,
      ["Transparent", "Surface", "Glass"],
      d.navBackground,
    ),
    navAlignment: pickOne(raw.navAlignment, alignments, d.navAlignment),
    mainImage: safeHttpUrl(raw.mainImage) ?? "",
    mobileImage: safeHttpUrl(raw.mobileImage) ?? "",
    galleryImages,
    imageMode: pickOne(
      raw.imageMode,
      ["Single Image", "Slideshow"],
      d.imageMode,
    ),
    imageFit: pickOne(raw.imageFit, ["Cover", "Contain"], d.imageFit),
    focusX: numRange(raw.focusX, 0, 100, d.focusX),
    focusY: numRange(raw.focusY, 0, 100, d.focusY),
    mobileFocusX: numRange(raw.mobileFocusX, 0, 100, d.mobileFocusX),
    mobileFocusY: numRange(raw.mobileFocusY, 0, 100, d.mobileFocusY),
    slideInterval: numRange(raw.slideInterval, 2, 15, d.slideInterval),
    slideTransition: pickOne(
      raw.slideTransition,
      ["Fade", "Slide", "Crossfade"],
      d.slideTransition,
    ),
    overlay: pickOne(raw.overlay, overlays, d.overlay),
    overlayColor: hexVal(raw.overlayColor, d.overlayColor),
    opacity: numRange(raw.opacity, 0, 95, d.opacity),
    decoration: pickOne(raw.decoration, decorations, d.decoration),
    decorationOpacity: numRange(
      raw.decorationOpacity,
      0,
      100,
      d.decorationOpacity,
    ),
    primary: hexVal(raw.primary, d.primary),
    background: hexVal(raw.background, d.background),
    text: hexVal(raw.text, d.text),
    surface: hexVal(raw.surface, d.surface),
    accent: hexVal(raw.accent, d.accent),
    buttonText: hexVal(raw.buttonText, d.buttonText),
    headingFont: strVal(raw.headingFont, d.headingFont, 60) || d.headingFont,
    bodyFont: strVal(raw.bodyFont, d.bodyFont, 60) || d.bodyFont,
    headingSize: pickOne(
      raw.headingSize,
      ["Small", "Medium", "Large", "Display"],
      d.headingSize,
    ),
    headingWeight: pickOne(
      raw.headingWeight,
      ["Regular", "Medium", "Semibold", "Bold"],
      d.headingWeight,
    ),
    bodySize: pickOne(raw.bodySize, ["Small", "Medium", "Large"], d.bodySize),
    bodyWeight: pickOne(raw.bodyWeight, ["Regular", "Medium"], d.bodyWeight),
    letterSpacing: pickOne(
      raw.letterSpacing,
      ["Tight", "Normal", "Wide"],
      d.letterSpacing,
    ),
    headingCase: pickOne(
      raw.headingCase,
      ["Original", "Uppercase", "Lowercase"],
      d.headingCase,
    ),
    headingStyle: pickOne(raw.headingStyle, ["Normal", "Italic"], d.headingStyle),
    buttonShape: pickOne(raw.buttonShape, buttonShapes, d.buttonShape),
    buttonStyle: pickOne(raw.buttonStyle, buttonStyles, d.buttonStyle),
    secondaryStyle: pickOne(
      raw.secondaryStyle,
      secondaryStyles,
      d.secondaryStyle,
    ),
    buttonSize: pickOne(raw.buttonSize, ["Small", "Medium", "Large"], d.buttonSize),
    buttonWidth: pickOne(
      raw.buttonWidth,
      ["Automatic", "Full Width"],
      d.buttonWidth,
    ),
    buttonIcon: pickOne(raw.buttonIcon, buttonIcons, d.buttonIcon),
    iconStyle: pickOne(
      raw.iconStyle,
      ["Outline", "Solid", "Duotone"],
      d.iconStyle,
    ),
    iconSize: pickOne(raw.iconSize, ["Small", "Medium", "Large"], d.iconSize),
    tileShape: pickOne(
      raw.tileShape,
      ["Square", "Soft Rounded", "Pill"],
      d.tileShape,
    ),
    tileShadow: pickOne(
      raw.tileShadow,
      ["None", "Subtle", "Elevated"],
      d.tileShadow,
    ),
    logoDisplay: pickOne(raw.logoDisplay, logoDisplays, d.logoDisplay),
    logoPosition: pickOne(raw.logoPosition, logoPositions, d.logoPosition),
    logoSize: pickOne(raw.logoSize, ["Small", "Medium", "Large"], d.logoSize),
    showName: boolVal(raw.showName, d.showName),
    headline: strVal(raw.headline, d.headline, 120),
    showHeadline: boolVal(raw.showHeadline, d.showHeadline),
    subtitle: strVal(raw.subtitle, d.subtitle, 240),
    showSubtitle: boolVal(raw.showSubtitle, d.showSubtitle),
    headlineAlignment: pickOne(
      raw.headlineAlignment,
      ["Automatic", "Left", "Centre", "Right"],
      d.headlineAlignment,
    ),
    announcement: strVal(raw.announcement, d.announcement, 140),
    showAnnouncement: boolVal(raw.showAnnouncement, d.showAnnouncement),
    announcementStyle: pickOne(
      raw.announcementStyle,
      ["Small Text", "Badge", "Banner"],
      d.announcementStyle,
    ),
    announcementAlignment: pickOne(
      raw.announcementAlignment,
      ["Automatic", "Left", "Centre", "Right"],
      d.announcementAlignment,
    ),
    showPhone: boolVal(raw.showPhone, d.showPhone),
    showAddress: boolVal(raw.showAddress, d.showAddress),
    mobileLayout: pickOne(raw.mobileLayout, mobileLayouts, d.mobileLayout),
    mobilePosition: pickOne(
      raw.mobilePosition,
      ["Automatic", "Top", "Centre", "Bottom"],
      d.mobilePosition,
    ),
    mobileAlignment: pickOne(
      raw.mobileAlignment,
      ["Automatic", "Left", "Centre", "Right"],
      d.mobileAlignment,
    ),
    mobileImageHeight: pickOne(
      raw.mobileImageHeight,
      ["Automatic", "Compact", "Tall"],
      d.mobileImageHeight,
    ),
    mobileSticky: boolVal(raw.mobileSticky, d.mobileSticky),
    animation: pickOne(
      raw.animation,
      ["None", "Subtle Fade", "Rise Up", "Slide In"],
      d.animation,
    ),
    showPoweredBy: boolVal(raw.showPoweredBy, d.showPoweredBy),
    actions: normalizeActions(raw.actions, DEFAULT_LINK_ACTIONS),
  };
}
