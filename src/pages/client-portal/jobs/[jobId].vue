<template>
  <div class="h-dvh overflow-y-auto scroll-smooth" :style="themeVars">
    <div
      v-if="notice"
      class="fixed bottom-20 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-md border px-4 py-2 text-center text-xs shadow-lg"
      :style="{
        background: 'var(--p-card, #111)',
        borderColor: 'var(--p-border, rgba(255,255,255,0.12))',
        color: 'var(--p-text, #f2f5f3)',
      }"
      role="status"
    >
      {{ notice }}
    </div>

    <div
      class="portal min-h-full antialiased transition-colors duration-300"
      :style="{ background: 'var(--p-shell)', color: 'var(--p-text)' }"
    >
      <div
        v-if="isLoading"
        class="flex min-h-screen items-center justify-center"
      >
        <div class="space-y-3 text-center">
          <div
            class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
            :style="{ borderColor: 'var(--p-accent)', borderTopColor: 'transparent' }"
          />
          <p class="text-xs uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
            Loading portal
          </p>
        </div>
      </div>

      <div
        v-else-if="accessExpired"
        class="flex min-h-screen items-center justify-center px-6"
      >
        <div class="max-w-sm text-center">
          <p class="text-lg font-medium">Portal access expired.</p>
          <p class="mt-2 text-sm" :style="{ color: 'var(--p-muted)' }">
            Sign in again to continue.
          </p>
        </div>
      </div>

      <div v-else-if="error" class="flex min-h-screen items-center justify-center px-6">
        <div class="max-w-sm text-center">
          <p class="text-lg font-medium">Oops, something went wrong.</p>
          <p class="mt-2 text-sm" :style="{ color: 'var(--p-muted)' }">{{ error }}</p>
          <button
            type="button"
            class="mt-4 text-xs font-semibold uppercase tracking-wider"
            :style="{ color: 'var(--p-accent)' }"
            @click="goToJobs"
          >
            Back to jobs
          </button>
        </div>
      </div>

      <template v-else-if="portalData">
        <div class="min-h-screen pb-24" :style="{ background: 'var(--p-shell)' }">
          <header
            class="sticky top-0 z-30 px-4 py-4 sm:px-6 transition-colors duration-300"
            :style="{
              background: 'var(--p-shell)',
            }"
          >
            <div class="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center transition-colors"
                  :style="{ color: 'var(--p-muted)' }"
                  aria-label="All jobs"
                  @click="goToJobs"
                >
                  <ChevronLeft class="h-5 w-5" />
                </button>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold tracking-wide" style="font-family: 'Cormorant Garamond', serif; font-size: 1.2rem;">{{ portalData.title }}</p>
                  <p class="text-[9px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
                    {{ portalData.studio.name }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center transition-colors"
                  :style="{ color: 'var(--p-muted)' }"
                  :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                  @click="toggleDark"
                >
                  <Sun v-if="isDark" class="h-4 w-4" />
                  <Moon v-else class="h-4 w-4" />
                </button>
                <div ref="actionsMenuEl" class="relative">
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center transition-colors"
                    :style="{ color: 'var(--p-muted)' }"
                    aria-label="More portal actions"
                    :aria-expanded="actionsOpen"
                    @click.stop="actionsOpen = !actionsOpen"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                  <div
                    v-if="actionsOpen"
                    class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-sm border shadow-xl"
                    :style="{
                      background: 'var(--p-shell)',
                      borderColor: 'color-mix(in srgb, var(--p-border) 60%, transparent)',
                      color: 'var(--p-text)',
                    }"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--p-hover)]"
                      @click="runPortalAction(copyPortalLink)"
                    >
                      <Copy class="h-4 w-4" />
                      Copy portal link
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--p-hover)]"
                      @click="runPortalAction(sharePortal)"
                    >
                      <Share2 class="h-4 w-4" />
                      Share portal
                    </button>
                    <button
                      v-if="!isStandalone"
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--p-hover)]"
                      @click="runPortalAction(savePortalToHomeScreen)"
                    >
                      <Download class="h-4 w-4" />
                      Save to Home Screen
                    </button>
                    <button
                      v-if="portalData.hasPasscode"
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--p-hover)]"
                      @click="runPortalAction(() => { isChangePasscodeOpen = true; })"
                    >
                      <KeyRound class="h-4 w-4" />
                      Change passcode
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--p-hover)]"
                      @click="runPortalAction(logout)"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <RouterView />
        </div>

        <nav
          class="fixed inset-x-0 bottom-0 z-40 py-4 transition-colors duration-300"
          :style="{
            background: 'var(--p-shell)',
            borderTop: '1px solid color-mix(in srgb, var(--p-border) 40%, transparent)',
          }"
          aria-label="Portal sections"
        >
          <div class="mx-auto flex max-w-4xl justify-center gap-8 sm:gap-12 px-4">
            <RouterLink
              v-for="item in portalNavigation"
              :key="item.name"
              :to="{ name: item.name, params: { jobId: currentJobId } }"
              class="group flex flex-col items-center justify-center gap-1.5 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] transition-colors"
              :style="{ color: isNavActive(item.name) ? 'var(--p-text)' : 'var(--p-muted)' }"
            >
              <component :is="item.icon" class="h-4 w-4" />
              {{ item.label }}
            </RouterLink>
          </div>
        </nav>
      </template>
    </div>

    <PortalPasscodeDialog
      :open="isChangePasscodeOpen"
      mode="change"
      :loading="isChangingPasscode"
      :accent-color="portalData?.accentColor"
      @update:open="isChangePasscodeOpen = $event"
      @submit="handlePasscodeSubmit"
    />
    <PortalInvoicePdfDialog
      :open="isInvoicePdfOpen"
      :job-id="currentJobId"
      :invoice="selectedInvoice"
      :accent-color="portalData?.accentColor"
      @update:open="handleInvoicePdfOpen"
    />
    <PortalInstallHelpDialog
      :open="isInstallHelpOpen"
      :is-ios-safari="isIosSafari"
      :has-different-saved-portal="hasDifferentSavedPortal"
      :accent-color="portalData?.accentColor"
      @update:open="isInstallHelpOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Home,
  KeyRound,
  Link,
  Moon,
  MoreHorizontal,
  ReceiptText,
  Share2,
  Sun,
} from "lucide-vue-next";
import PortalInstallHelpDialog from "@/components/portal/PortalInstallHelpDialog.vue";
import PortalInvoicePdfDialog from "@/components/portal/PortalInvoicePdfDialog.vue";
import PortalPasscodeDialog from "@/components/portal/PortalPasscodeDialog.vue";
import { useClientPortalJobProvide } from "@/composables/useClientPortalJob";

const route = useRoute();
const ctx = useClientPortalJobProvide();
const {
  isDark,
  toggleDark,
  isLoading,
  accessExpired,
  error,
  notice,
  portalData,
  isChangePasscodeOpen,
  isChangingPasscode,
  selectedInvoice,
  isInvoicePdfOpen,
  isInstallHelpOpen,
  hasDifferentSavedPortal,
  actionsOpen,
  actionsMenuEl,
  isStandalone,
  isIosSafari,
  currentJobId,
  themeVars,
  runPortalAction,
  handleInvoicePdfOpen,
  copyPortalLink,
  sharePortal,
  savePortalToHomeScreen,
  handlePasscodeSubmit,
  goToJobs,
  logout,
} = ctx;

const portalNavigation = [
  { label: "Overview", name: "client-portal-job-overview", icon: Home },
  { label: "Contract", name: "client-portal-job-contract", icon: FileText },
  { label: "Payment", name: "client-portal-job-payment", icon: ReceiptText },
  { label: "Link", name: "client-portal-job-link", icon: Link },
];

function isNavActive(name: string) {
  return route.name === name;
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap");

.portal {
  font-family: "DM Sans", system-ui, sans-serif;
}
</style>
