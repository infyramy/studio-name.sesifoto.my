<template>
  <div class="gate" :style="themeVars">
    <div v-if="booting" class="gate__boot">
      <div class="gate__spinner" />
      <p>Loading portal…</p>
    </div>

    <div v-else class="gate__split">
      <main class="gate__content">
        <div class="gate__panel">
          <form class="gate__form" @submit.prevent="submit">
          <header class="gate__header">
            <div class="gate__brand">
              <div class="gate__logo-wrap">
                <img
                  v-if="gate?.logoUrl"
                  :src="gate.logoUrl"
                  :alt="gate.studioName"
                  class="gate__logo"
                />
                <span v-else class="gate__logo-fallback">{{ studioInitial }}</span>
              </div>
              <div class="gate__brand-text">
                <p class="gate__eyebrow">Client Portal</p>
                <p class="gate__studio">{{ gate?.studioName || studioName }}</p>
              </div>
            </div>
            <button
              type="button"
              class="gate__theme-toggle"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleDark"
            >
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
          </header>

          <div class="gate__body">
            <h1 class="gate__title">Sign in</h1>
            <p class="gate__sub">Enter your email and passcode to access your jobs.</p>

            <div class="gate__fields">
              <div class="gate__input-wrap">
                <Mail class="gate__icon" />
                <input
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="Email address"
                />
              </div>

              <div class="gate__input-wrap">
                <KeyRound class="gate__icon" />
                <input
                  v-model="passcode"
                  :type="showPasscode ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  minlength="4"
                  placeholder="Passcode"
                />
                <button
                  type="button"
                  class="gate__reveal"
                  :aria-label="showPasscode ? 'Hide passcode' : 'Show passcode'"
                  @click="showPasscode = !showPasscode"
                >
                  <EyeOff v-if="showPasscode" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <p v-if="error" class="gate__error" role="alert">{{ error }}</p>

            <button type="submit" class="gate__submit" :disabled="loading">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? "Signing in…" : "Log in" }}
            </button>

            <p class="gate__help">Forgot passcode? Contact your studio.</p>
          </div>
          </form>

          <footer class="gate__footer">
            <span class="gate__footer-label">Platform by</span>
            <img
              :src="sesifotoLogo"
              alt="Sesifoto"
              class="gate__footer-logo"
            />
          </footer>
        </div>
      </main>

      <aside class="gate__visual" aria-hidden="true">
        <img v-if="heroUrl" :src="heroUrl" alt="" class="gate__visual-img" />
        <div v-else class="gate__visual-fallback" />
        <div class="gate__visual-blur" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Moon,
  Sun,
} from "lucide-vue-next";
import sesifotoLogoDark from "@/assets/logo/full-dark.png";
import sesifotoLogoLight from "@/assets/logo/full-light.png";
import { usePortalTheme } from "@/composables/usePortalTheme";
import { PortalApiError, portalService } from "@/services/portal.service";
import { useStudioStore } from "@/stores/studio";

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme();

const email = ref("");
const passcode = ref("");
const showPasscode = ref(false);
const loading = ref(false);
const booting = ref(true);
const error = ref("");
const gate = ref<Awaited<ReturnType<typeof portalService.getLoginGate>> | null>(
  null,
);

const studioName = computed(() => studioStore.studio?.name || "Studio");
const studioInitial = computed(
  () => (gate.value?.studioName || studioName.value).charAt(0).toUpperCase(),
);
const heroUrl = computed(() => gate.value?.heroUrl || "");
const sesifotoLogo = computed(() =>
  isDark.value ? sesifotoLogoLight : sesifotoLogoDark,
);

function nextJobId(): string {
  const value = route.query.nextJob;
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function applyGateTheme(
  data: Awaited<ReturnType<typeof portalService.getLoginGate>>,
) {
  setAccent(data.accentColor || data.brandColor);
}

async function goAfterAuth() {
  const jobId = nextJobId();
  if (jobId) {
    const query = { ...route.query };
    delete query.nextJob;
    delete query.token;
    await router.replace({
      name: "client-portal-job-overview",
      params: { jobId },
      query,
    });
    return;
  }
  await router.replace({ name: "client-portal-jobs" });
}

onMounted(async () => {
  setAccent(studioStore.brandColor);
  const slug = studioStore.studio?.slug;
  try {
    if (slug) {
      gate.value = await portalService.getLoginGate(slug, {
        jobId: nextJobId() || undefined,
      });
      applyGateTheme(gate.value);
    }

    try {
      await portalService.listMyJobs();
      await goAfterAuth();
      return;
    } catch {
      // stay on gate
    }
  } finally {
    booting.value = false;
  }
});

async function submit() {
  const slug = studioStore.studio?.slug;
  if (!slug || loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    const result = await portalService.login({
      studioSlug: slug,
      email: email.value.trim(),
      passcode: passcode.value,
    });
    setAccent(result.studio.brandColor);
    if (gate.value?.accentColor) setAccent(gate.value.accentColor);
    await goAfterAuth();
  } catch (caught: unknown) {
    if (caught instanceof PortalApiError) {
      error.value =
        caught.code === "PORTAL_PASSCODE_INCORRECT"
          ? "Invalid email or passcode."
          : caught.message || "Unable to sign in.";
    } else {
      error.value = "Unable to sign in. Please try again.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap");

.gate {
  font-family: "DM Sans", system-ui, sans-serif;
  color: var(--p-text);
  background: var(--p-shell);
  min-height: 100dvh;
}

.gate__boot {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  color: var(--p-muted);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gate__spinner {
  height: 2rem;
  width: 2rem;
  border-radius: 999px;
  border: 2px solid var(--p-accent);
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.gate__split {
  display: flex;
  min-height: 100dvh;
}

.gate__visual {
  position: relative;
  display: none;
  flex: 1;
  overflow: hidden;
  background: color-mix(in srgb, var(--p-accent) 20%, var(--p-shell));
}

@media (min-width: 900px) {
  .gate__visual {
    display: block;
  }
}

.gate__visual-img {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.gate__visual-fallback {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 30% 40%,
      color-mix(in srgb, var(--p-accent) 40%, transparent),
      transparent 60%
    ),
    var(--p-shell);
}

.gate__visual::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to left, transparent 0%, transparent 60%, var(--p-shell) 100%);
}

.gate__visual-blur {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  mask-image: linear-gradient(to left, transparent 30%, black 100%);
  -webkit-mask-image: linear-gradient(to left, transparent 30%, black 100%);
}

.gate__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  position: relative;
  background: var(--p-shell);
}

@media (min-width: 900px) {
  .gate__content {
    max-width: 36rem;
  }
}

.gate__panel {
  margin: auto;
  width: 100%;
  max-width: 28rem;
  padding: 3rem 2rem 2rem;
  animation: gate-in 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.gate__form {
  width: 100%;
}

.gate__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rem;
}

.gate__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gate__logo-wrap {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid var(--p-border);
  background: var(--p-accent-bg);
}

.gate__logo {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.gate__logo-fallback {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--p-accent);
}

.gate__brand-text {
  min-width: 0;
}

.gate__eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--p-muted);
}

.gate__studio {
  margin: 0.15rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 600;
}

.gate__theme-toggle {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p-border);
  border-radius: 999px;
  background: var(--p-card);
  color: var(--p-muted);
  cursor: pointer;
  transition: background 150ms ease;
}

.gate__theme-toggle:hover {
  background: var(--p-hover);
}

.gate__body {
  margin-top: 1rem;
}

.gate__title {
  margin: 0;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 3.2rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--p-text);
}

.gate__sub {
  margin: 0.75rem 0 2.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--p-muted);
}

.gate__fields {
  display: grid;
  gap: 1.25rem;
}

.gate__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.gate__icon {
  position: absolute;
  left: 0;
  height: 1.1rem;
  width: 1.1rem;
  color: var(--p-muted);
  pointer-events: none;
}

.gate__input-wrap input {
  width: 100%;
  height: 3.25rem;
  border: none;
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 60%, transparent);
  border-radius: 0;
  background: transparent;
  padding: 0 2.5rem 0 2rem;
  font-size: 0.95rem;
  color: var(--p-text);
  outline: none;
  transition: border-color 300ms ease;
}

.gate__input-wrap input:focus {
  border-bottom-color: var(--p-accent);
}

.gate__reveal {
  position: absolute;
  right: 0;
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--p-muted);
  cursor: pointer;
}

.gate__error {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #e07070;
}

.gate__submit {
  margin-top: 2.5rem;
  display: inline-flex;
  width: 100%;
  height: 3.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 2px;
  background: var(--p-text);
  color: var(--p-shell);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 200ms ease, transform 200ms ease;
}

.gate__submit:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.gate__submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.gate__help {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.78rem;
  color: var(--p-muted);
}

.gate__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 4rem;
  opacity: 0.8;
}

.gate__footer-label {
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--p-muted);
}

.gate__footer-logo {
  height: 1.35rem;
  width: auto;
  opacity: 0.9;
}

@keyframes gate-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 899px) {
  .gate__split {
    flex-direction: column;
  }

  .gate__visual {
    display: block;
    order: -1;
    height: 35vh;
    flex: none;
  }

  .gate__visual::after {
    background: linear-gradient(to bottom, transparent 0%, transparent 60%, var(--p-shell) 100%);
  }

  .gate__visual-blur {
    mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
  }

  .gate__content {
    margin-top: -3rem;
    z-index: 10;
    background: transparent;
  }

  .gate__panel {
    padding: 2rem 1.5rem;
  }

  .gate__header {
    margin-bottom: 2rem;
  }

  .gate__body {
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gate__panel {
    animation: none;
  }
  .gate__spinner {
    animation: none;
  }
}
</style>
