<template>
  <div class="jobs" :style="themeVars">
    <header class="jobs__header">
      <div>
        <p class="jobs__eyebrow">Client portal</p>
        <h1 class="jobs__title">Your jobs</h1>
        <p class="jobs__sub">Choose a job to open its portal.</p>
      </div>
      <div class="jobs__actions">
        <button
          type="button"
          class="jobs__icon-btn"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
        <button type="button" class="jobs__logout" @click="logout">
          Log out
        </button>
      </div>
    </header>

    <div v-if="loading" class="jobs__state">
      <div class="jobs__spinner" />
      <p>Loading jobs…</p>
    </div>

    <div v-else-if="error" class="jobs__state">
      <p class="jobs__error">{{ error }}</p>
      <button type="button" class="jobs__retry" @click="load">Try again</button>
    </div>

    <div v-else-if="!items.length" class="jobs__state">
      <p>No jobs linked to this account yet.</p>
      <p class="jobs__hint">Ask your studio if something looks missing.</p>
    </div>

    <ul v-else class="jobs__list">
      <li v-for="job in items" :key="job.id">
        <button type="button" class="jobs__card" @click="openJob(job.id)">
          <div
            class="jobs__thumb"
            :style="
              job.heroThumb
                ? { backgroundImage: `url(${job.heroThumb})` }
                : undefined
            "
          />
          <div class="jobs__meta">
            <p class="jobs__name">{{ job.title }}</p>
            <p class="jobs__row">
              <span>{{ formatStatus(job.status) }}</span>
              <span v-if="job.eventDate"> · {{ formatDate(job.eventDate) }}</span>
            </p>
            <p v-if="job.venue" class="jobs__venue">{{ job.venue }}</p>
            <p class="jobs__balance">
              {{
                job.balanceDue > 0
                  ? `${formatMoney(job.balanceDue, job.currency)} due`
                  : "No balance due"
              }}
            </p>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Moon, Sun } from "lucide-vue-next";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  PortalApiError,
  portalService,
  type PortalJobSummary,
} from "@/services/portal.service";
import { useStudioStore } from "@/stores/studio";

const router = useRouter();
const studioStore = useStudioStore();
const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme();

const loading = ref(true);
const error = ref("");
const items = ref<PortalJobSummary[]>([]);

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatMoney(value: number, currency: string | null) {
  if (!currency) {
    return value.toLocaleString("en-MY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-MY")}`;
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  setAccent(studioStore.brandColor);
  try {
    const slug = studioStore.studio?.slug;
    if (slug) {
      const gate = await portalService.getLoginGate(slug);
      setAccent(gate.accentColor || gate.brandColor);
    }
  } catch {
    // keep studio brand
  }
  try {
    items.value = await portalService.listMyJobs();
  } catch (caught: unknown) {
    if (caught instanceof PortalApiError && caught.status === 401) {
      await router.replace({ name: "client-portal-access" });
      return;
    }
    error.value =
      caught instanceof PortalApiError
        ? caught.message
        : "Unable to load jobs.";
  } finally {
    loading.value = false;
  }
}

function openJob(jobId: string) {
  void router.push({
    name: "client-portal-job-overview",
    params: { jobId },
  });
}

async function logout() {
  try {
    await portalService.logout();
  } catch {
    // continue
  }
  await router.replace({ name: "client-portal-access" });
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap");

.jobs {
  min-height: 100dvh;
  padding: 3rem 2rem 4rem;
  background: var(--p-shell);
  color: var(--p-text);
  font-family: "DM Sans", system-ui, sans-serif;
  transition: background 200ms ease, color 200ms ease;
}

.jobs__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  max-width: 48rem;
  margin: 0 auto 4rem;
}

.jobs__eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--p-muted);
}

.jobs__title {
  margin: 0.5rem 0 0;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 3.2rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.jobs__sub {
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  color: var(--p-muted);
}

.jobs__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.jobs__icon-btn,
.jobs__logout {
  border: 0;
  background: transparent;
  color: var(--p-muted);
  cursor: pointer;
  transition: color 150ms ease;
}

.jobs__icon-btn:hover,
.jobs__logout:hover {
  color: var(--p-text);
}

.jobs__icon-btn {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
}

.jobs__logout {
  padding: 0.45rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.jobs__state {
  max-width: 48rem;
  margin: 4rem auto;
  text-align: center;
  color: var(--p-muted);
}

.jobs__spinner {
  margin: 0 auto 1rem;
  height: 2rem;
  width: 2rem;
  border-radius: 999px;
  border: 2px solid var(--p-accent);
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.jobs__error {
  color: #e07070;
}

.jobs__retry {
  margin-top: 1rem;
  border: 0;
  border-radius: 2px;
  background: var(--p-text);
  color: var(--p-shell);
  padding: 0.65rem 1.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.jobs__hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.jobs__list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 48rem;
  display: grid;
  gap: 1.5rem;
}

.jobs__card {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 1.5rem;
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 60%, transparent);
  border-radius: 0;
  background: transparent;
  color: var(--p-text);
  padding: 0 0 1.5rem;
  cursor: pointer;
  transition: opacity 200ms ease, transform 200ms ease;
}

.jobs__card:hover {
  opacity: 0.8;
  transform: translateX(4px);
}

.jobs__thumb {
  height: 8rem;
  border-radius: 2px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--p-accent) 35%, var(--p-shell)),
      var(--p-accent)
    );
  background-size: cover;
  background-position: center;
}

.jobs__name {
  margin: 0;
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 1.85rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.jobs__row,
.jobs__venue,
.jobs__balance {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--p-muted);
  text-transform: capitalize;
}

.jobs__balance {
  color: var(--p-accent);
  font-weight: 600;
  margin-top: 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
