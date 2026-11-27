import { computed, ref } from "vue";
import type { BookingPackage, Theme } from "@/types";
import type { CartHold } from "./types";

export interface PackageSessionDraft {
  theme: Theme;
  sequence: number;
  date: string;
  slot: any;
  pax: number;
  addons: Record<string, number>;
  hold?: CartHold;
  /** Extras only (extra pax + addons); theme base excluded */
  extrasTotal: number;
}

export interface PackageChainSegment {
  themeId: string;
  sequence: number;
  startTime: string;
  endTime: string;
}

export interface PackageChainStart {
  startTime: string;
  chain: PackageChainSegment[];
}

export function usePackageBookingWizard() {
  const activePackage = ref<BookingPackage | null>(null);
  const bookingGroupId = ref<string | null>(null);
  const currentSequenceIndex = ref(0);
  const completedSessions = ref<PackageSessionDraft[]>([]);
  /** Attempt order theme ids (studio default or customer reorder) */
  const orderedThemeIds = ref<string[]>([]);
  const orderConfirmed = ref(false);
  const selectedChain = ref<PackageChainStart | null>(null);

  const isPackageMode = computed(() => !!activePackage.value);

  const isContinuousPackage = computed(
    () => activePackage.value?.timingMode === "continuous",
  );

  const canReorderThemes = computed(
    () =>
      !!activePackage.value?.allowThemeReorder && isContinuousPackage.value,
  );

  const packageThemes = computed(() => {
    if (!activePackage.value) return [];
    const byId = new Map(
      activePackage.value.themes.map((t) => [t.themeId, t]),
    );
    const ids =
      orderedThemeIds.value.length > 0
        ? orderedThemeIds.value
        : [...activePackage.value.themes]
            .sort((a, b) => a.sequence - b.sequence)
            .map((t) => t.themeId);

    return ids
      .map((themeId, index) => {
        const meta = byId.get(themeId);
        if (!meta) return null;
        return {
          ...meta,
          sequence: index + 1,
        };
      })
      .filter(Boolean) as Array<
      BookingPackage["themes"][number] & { sequence: number }
    >;
  });

  const currentPackageTheme = computed(() => {
    return packageThemes.value[currentSequenceIndex.value] || null;
  });

  const isLastPackageTheme = computed(() => {
    if (!activePackage.value) return true;
    return currentSequenceIndex.value >= packageThemes.value.length - 1;
  });

  const packageProgressLabel = computed(() => {
    if (!activePackage.value || !currentPackageTheme.value) return "";
    return `${currentSequenceIndex.value + 1} / ${packageThemes.value.length}`;
  });

  function startPackage(pkg: BookingPackage) {
    activePackage.value = pkg;
    bookingGroupId.value = crypto.randomUUID();
    currentSequenceIndex.value = 0;
    completedSessions.value = [];
    orderedThemeIds.value = [...pkg.themes]
      .sort((a, b) => a.sequence - b.sequence)
      .map((t) => t.themeId);
    orderConfirmed.value = !(
      pkg.timingMode === "continuous" && pkg.allowThemeReorder
    );
    selectedChain.value = null;
  }

  function clearPackage() {
    activePackage.value = null;
    bookingGroupId.value = null;
    currentSequenceIndex.value = 0;
    completedSessions.value = [];
    orderedThemeIds.value = [];
    orderConfirmed.value = false;
    selectedChain.value = null;
  }

  function moveOrderedTheme(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= orderedThemeIds.value.length) return;
    const copy = [...orderedThemeIds.value];
    const tmp = copy[index]!;
    copy[index] = copy[next]!;
    copy[next] = tmp;
    orderedThemeIds.value = copy;
    selectedChain.value = null;
  }

  function setOrderedThemeIds(themeIds: string[]) {
    orderedThemeIds.value = [...themeIds];
    selectedChain.value = null;
  }

  function confirmThemeOrder() {
    orderConfirmed.value = true;
  }

  function setSelectedChain(chain: PackageChainStart | null) {
    selectedChain.value = chain;
  }

  function resolveTheme(
    themes: Theme[],
    themeId: string,
  ): Theme | undefined {
    return themes.find((t) => t.id === themeId);
  }

  function stashCurrentSession(session: PackageSessionDraft) {
    completedSessions.value = [
      ...completedSessions.value.filter((s) => s.sequence !== session.sequence),
      session,
    ].sort((a, b) => a.sequence - b.sequence);
  }

  function advanceSequence(): boolean {
    if (isLastPackageTheme.value) return false;
    currentSequenceIndex.value += 1;
    return true;
  }

  function allSessionsIncludingCurrent(
    current: PackageSessionDraft | null,
  ): PackageSessionDraft[] {
    const map = new Map<number, PackageSessionDraft>();
    for (const s of completedSessions.value) {
      map.set(s.sequence, s);
    }
    if (current) {
      map.set(current.sequence, current);
    }
    return [...map.values()].sort((a, b) => a.sequence - b.sequence);
  }

  function packagePayableTotal(sessions: PackageSessionDraft[]): number {
    if (!activePackage.value) {
      return sessions.reduce((sum, s) => sum + s.extrasTotal, 0);
    }
    return (
      activePackage.value.basePrice +
      sessions.reduce((sum, s) => sum + s.extrasTotal, 0)
    );
  }

  return {
    activePackage,
    bookingGroupId,
    currentSequenceIndex,
    completedSessions,
    orderedThemeIds,
    orderConfirmed,
    selectedChain,
    isPackageMode,
    isContinuousPackage,
    canReorderThemes,
    packageThemes,
    currentPackageTheme,
    isLastPackageTheme,
    packageProgressLabel,
    startPackage,
    clearPackage,
    moveOrderedTheme,
    setOrderedThemeIds,
    confirmThemeOrder,
    setSelectedChain,
    resolveTheme,
    stashCurrentSession,
    advanceSequence,
    allSessionsIncludingCurrent,
    packagePayableTotal,
  };
}
