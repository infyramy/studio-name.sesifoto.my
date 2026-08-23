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
        v-if="isLoading || pendingToken"
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
            Ask the studio for a new portal link.
          </p>
        </div>
      </div>

      <div v-else-if="error" class="flex min-h-screen items-center justify-center px-6">
        <div class="max-w-sm text-center">
          <p class="text-lg font-medium">Oops, something went wrong.</p>
          <p class="mt-2 text-sm" :style="{ color: 'var(--p-muted)' }">{{ error }}</p>
        </div>
      </div>

      <template v-else-if="portalData">
        <div
          class="min-h-screen pb-24"
          :style="{ background: 'var(--p-bg)' }"
        >
          <!-- Hero -->
          <section
            id="home"
            class="portal-reveal relative h-[72dvh] min-h-[500px] overflow-hidden"
          >
            <img
              v-if="portalHeroImage"
              :src="portalHeroImage"
              :alt="`${portalData.title} media`"
              loading="eager"
              decoding="async"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/85" />

            <div class="relative mx-auto flex h-full max-w-6xl flex-col justify-between px-5 py-6 text-white sm:px-8 sm:py-8">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    v-if="portalData.studio.logoUrl"
                    class="h-9 w-9 overflow-hidden rounded-full border border-white/20"
                  >
                    <img
                      :src="portalData.studio.logoUrl"
                      :alt="portalData.studio.name"
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold backdrop-blur"
                  >
                    {{ portalData.studio.name[0] }}
                  </div>
                  <div class="leading-tight">
                    <p class="text-sm font-semibold">{{ portalData.studio.name }}</p>
                    <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/55">
                      Client portal
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
                    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                    @click="isDark = !isDark"
                  >
                    <Sun v-if="isDark" class="h-4 w-4" />
                    <Moon v-else class="h-4 w-4" />
                  </button>
                  <a
                    v-if="studioWhatsApp"
                    :href="studioWhatsApp"
                    target="_blank"
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
                    aria-label="Message studio"
                  >
                    <MessageCircle class="h-4 w-4" />
                  </a>
                  <div ref="actionsMenuEl" class="relative">
                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
                      aria-label="More portal actions"
                      :aria-expanded="actionsOpen"
                      @click.stop="actionsOpen = !actionsOpen"
                    >
                      <MoreHorizontal class="h-4 w-4" />
                    </button>
                    <div
                      v-if="actionsOpen"
                      class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-white/10 bg-zinc-950 text-white shadow-lg"
                    >
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                        @click="runPortalAction(copyPortalLink)"
                      >
                        <Copy class="h-4 w-4" />
                        Copy portal link
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                        @click="runPortalAction(sharePortal)"
                      >
                        <Share2 class="h-4 w-4" />
                        Share portal
                      </button>
                      <button
                        v-if="!isStandalone"
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                        @click="runPortalAction(savePortalToHomeScreen)"
                      >
                        <Download class="h-4 w-4" />
                        Save to Home Screen
                      </button>
                      <button
                        v-if="portalData.hasPasscode"
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                        @click="runPortalAction(() => { isChangePasscodeOpen = true; })"
                      >
                        <KeyRound class="h-4 w-4" />
                        Change passcode
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="max-w-3xl">
                <p class="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65">
                  {{ portalData.title }}
                </p>
                <h1 class="text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                  {{ portalData.client.name }}
                </h1>
                <div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/65">
                  <span v-if="portalData.client.phone" class="flex items-center gap-2">
                    <Phone class="h-3.5 w-3.5" /> {{ portalData.client.phone }}
                  </span>
                  <span v-if="portalData.client.email" class="flex items-center gap-2">
                    <Mail class="h-3.5 w-3.5" /> {{ portalData.client.email }}
                  </span>
                  <span class="flex items-center gap-2">
                    <MapPin class="h-3.5 w-3.5" />
                    {{ primarySession?.venue || "Event details inside" }}
                  </span>
                </div>
                <a
                  v-if="studioWhatsApp"
                  :href="studioWhatsApp"
                  target="_blank"
                  class="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-white/90"
                >
                  <MessageCircle class="h-3.5 w-3.5" />
                  Message studio
                </a>
              </div>
            </div>
          </section>

          <main class="portal-reveal portal-reveal-late mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
            <section class="mb-7">
              <h2 class="text-2xl font-medium tracking-tight sm:text-3xl">
                Welcome, {{ portalData.client.name }}
              </h2>
              <p class="mt-1 text-xs" :style="{ color: 'var(--p-muted)' }">
                Everything shared with you is available here.
              </p>
            </section>

            <!-- Status banner -->
            <section
              class="mb-10 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              :style="{ background: 'var(--p-status)', borderColor: 'var(--p-status-border)' }"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
                >
                  <Clock v-if="portalData.billing.balanceDue > 0" class="h-4 w-4" />
                  <Check v-else class="h-4 w-4" />
                </span>
                <div>
                  <p class="text-sm font-semibold">
                    {{
                      portalData.billing.balanceDue > 0
                        ? portalData.billing.hasMixedCurrencies
                          ? "Outstanding invoices remain"
                          : `${formatMoney(
                              portalData.billing.balanceDue,
                              portalData.billing.currency,
                            )} balance remaining`
                        : "Your event is on track"
                    }}
                  </p>
                  <p class="mt-0.5 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                    Status: {{ portalData.status.replace(/_/g, " ") }}
                  </p>
                </div>
              </div>
              <a
                :href="portalData.billing.balanceDue > 0 ? '#billing' : '#sessions'"
                class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold transition hover:shadow-lg"
                :style="{
                  background: 'var(--p-accent)',
                  color: 'var(--p-accent-text)',
                }"
              >
                {{ portalData.billing.balanceDue > 0 ? "Review billing" : "View progress" }}
                <ArrowRight class="h-3.5 w-3.5" />
              </a>
            </section>

            <!-- Progress -->
            <section class="mb-12">
              <div class="mb-4 flex items-end justify-between">
                <div>
                  <p class="text-sm font-semibold">Event progress</p>
                  <p class="mt-1 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                    Your project journey at a glance.
                  </p>
                </div>
                <span class="text-[10px] font-semibold uppercase tracking-[0.18em]" :style="{ color: 'var(--p-accent)' }">
                  {{ jobSteps.filter((step) => step.done).length }} / {{ jobSteps.length }} complete
                </span>
              </div>
              <ol class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <li
                  v-for="step in jobSteps"
                  :key="step.label"
                  class="rounded-lg border p-4"
                  :style="{
                    borderColor: step.done ? 'var(--p-accent-border)' : 'var(--p-border)',
                    background: step.done ? 'var(--p-accent-bg)' : 'var(--p-card)',
                  }"
                >
                  <Check v-if="step.done" class="mb-4 h-4 w-4" :style="{ color: 'var(--p-accent)' }" />
                  <Clock v-else class="mb-4 h-4 w-4" :style="{ color: 'var(--p-muted)' }" />
                  <p class="text-xs font-semibold">{{ step.label }}</p>
                  <p class="mt-1 text-[10px]" :style="{ color: 'var(--p-muted)' }">{{ step.note }}</p>
                </li>
              </ol>
            </section>

            <!-- Sessions -->
            <section id="sessions" class="scroll-mt-5 border-t py-10" :style="{ borderColor: 'var(--p-border)' }">
              <div class="mb-5 flex items-end justify-between">
                <div>
                  <h2 class="text-sm font-semibold">Sessions</h2>
                  <p class="mt-1 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                    Dates, timing, and location.
                  </p>
                </div>
                <span class="text-[10px] uppercase tracking-[0.18em]" :style="{ color: 'var(--p-muted)' }">
                  {{ portalData.sessions.length }} total
                </span>
              </div>
              <p v-if="!portalData.sessions.length" class="py-6 text-sm" :style="{ color: 'var(--p-muted)' }">
                No sessions scheduled yet.
              </p>
              <div v-else class="divide-y" :style="{ borderColor: 'var(--p-border)' }">
                <article
                  v-for="session in portalData.sessions"
                  :key="session.type + session.date"
                  class="grid gap-4 py-5 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center"
                >
                  <div>
                    <p class="text-sm font-medium capitalize">{{ session.type.replace(/_/g, " ") }}</p>
                    <p class="mt-1 text-[10px] uppercase tracking-[0.16em]" :style="{ color: 'var(--p-accent)' }">
                      {{ session.status }}
                    </p>
                  </div>
                  <p class="flex items-center gap-2 text-xs" :style="{ color: 'var(--p-muted)' }">
                    <CalendarDays class="h-3.5 w-3.5" />
                    {{ formatDate(session.date) }}
                  </p>
                  <p class="flex items-center gap-2 text-xs" :style="{ color: 'var(--p-muted)' }">
                    <MapPin class="h-3.5 w-3.5" />
                    {{ session.venue || "Venue pending" }}
                  </p>
                  <p class="text-xs tabular-nums" :style="{ color: 'var(--p-muted)' }">
                    {{ session.startTime || "TBC" }}
                  </p>
                </article>
              </div>
            </section>

            <!-- Billing -->
            <section id="billing" class="scroll-mt-5 border-t py-10" :style="{ borderColor: 'var(--p-border)' }">
              <div class="grid gap-5 lg:grid-cols-[1fr_2fr]">
                <div
                  class="rounded-lg border p-5"
                  :style="{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }"
                >
                  <p class="text-[10px] font-semibold uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
                    Balance due
                  </p>
                  <p class="mt-2 text-3xl font-semibold tabular-nums">
                    {{
                      portalData.billing.hasMixedCurrencies
                        ? "Multiple currencies"
                        : formatMoney(
                            portalData.billing.balanceDue,
                            portalData.billing.currency,
                          )
                    }}
                  </p>
                  <template v-if="!portalData.billing.hasMixedCurrencies">
                    <div class="mt-6 h-1 overflow-hidden rounded-full" :style="{ background: 'var(--p-border)' }">
                      <div class="h-full rounded-full" :style="{ width: `${paidPercent}%`, background: 'var(--p-accent)' }" />
                    </div>
                    <div class="mt-2 flex justify-between text-[10px]" :style="{ color: 'var(--p-muted)' }">
                      <span>{{ paidPercent }}% paid</span>
                      <span>
                        {{ formatMoney(portalData.billing.totalInvoiced, portalData.billing.currency) }} total
                      </span>
                    </div>
                  </template>
                  <p
                    v-else
                    class="mt-3 text-[11px]"
                    :style="{ color: 'var(--p-muted)' }"
                  >
                    Pay each invoice in its listed currency.
                  </p>
                  <button
                    v-if="portalData.billing.canPayAll"
                    type="button"
                    class="mt-5 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium shadow transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                    :style="{ background: 'var(--p-accent)', color: 'var(--p-accent-text)' }"
                    :disabled="activeCheckout !== null"
                    @click="startCheckout({ scope: 'all' })"
                  >
                    <Loader2
                      v-if="activeCheckout === 'all'"
                      class="mr-2 h-4 w-4 animate-spin"
                    />
                    <CreditCard v-else class="mr-2 h-4 w-4" />
                    {{ activeCheckout === "all" ? "Opening checkout..." : "Pay all" }}
                  </button>
                </div>

                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-sm font-semibold">Invoices</h2>
                    <span class="text-[10px] uppercase tracking-[0.18em]" :style="{ color: 'var(--p-muted)' }">
                      {{ portalData.invoices.length }} files
                    </span>
                  </div>
                  <p v-if="!portalData.invoices.length" class="py-6 text-sm" :style="{ color: 'var(--p-muted)' }">
                    No invoices available.
                  </p>
                  <div v-else class="divide-y" :style="{ borderColor: 'var(--p-border)' }">
                    <div
                      v-for="invoice in portalData.invoices"
                      :key="invoice.id"
                      class="flex flex-wrap items-center gap-3 py-4 sm:gap-4"
                    >
                      <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                        :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
                      >
                        <FileText class="h-4 w-4" />
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-xs font-medium">{{ invoice.title }}</p>
                        <p class="mt-1 text-[10px]" :style="{ color: 'var(--p-muted)' }">
                          {{ invoice.number }}
                          <span v-if="invoice.dueDate"> · Due {{ formatDate(invoice.dueDate) }}</span>
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs font-medium tabular-nums">
                          {{ formatMoney(invoice.total, invoice.currency) }}
                        </p>
                        <p class="mt-1 text-[9px] uppercase tracking-[0.15em]" :style="{ color: 'var(--p-accent)' }">
                          {{ invoice.status }}
                        </p>
                      </div>
                      <div class="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <button
                          type="button"
                          class="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium shadow-sm transition hover:bg-[var(--p-hover)] disabled:pointer-events-none disabled:opacity-50"
                          :style="{
                            borderColor: 'var(--p-border)',
                            background: 'var(--p-card)',
                            color: 'var(--p-text)',
                          }"
                          @click="openInvoicePdf(invoice)"
                        >
                          <FileSearch class="mr-2 h-3.5 w-3.5" />
                          View PDF
                        </button>
                        <button
                          v-if="invoice.balanceDue > 0"
                          type="button"
                          class="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium shadow transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                          :style="{ background: 'var(--p-accent)', color: 'var(--p-accent-text)' }"
                          :disabled="activeCheckout !== null"
                          @click="startCheckout({ scope: 'invoice', invoiceId: invoice.id })"
                        >
                          <Loader2
                            v-if="activeCheckout === `invoice:${invoice.id}`"
                            class="mr-2 h-3.5 w-3.5 animate-spin"
                          />
                          <CreditCard v-else class="mr-2 h-3.5 w-3.5" />
                          {{
                            activeCheckout === `invoice:${invoice.id}`
                              ? "Opening..."
                              : "Pay"
                          }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Inspiration -->
            <section class="border-t py-10" :style="{ borderColor: 'var(--p-border)' }">
              <div class="mb-5 flex items-end justify-between">
                <div>
                  <h2 class="text-sm font-semibold">Inspiration</h2>
                  <p class="mt-1 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                    Creative references shared for your event.
                  </p>
                </div>
                <span class="text-[10px] uppercase tracking-[0.16em]" :style="{ color: 'var(--p-muted)' }">
                  {{ portalData.inspirationImages.length }} images
                </span>
              </div>
              <p v-if="!portalData.inspirationImages.length" class="rounded-lg border border-dashed p-6 text-xs" :style="{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }">
                No inspiration images shared yet.
              </p>
              <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <figure v-for="image in portalData.inspirationImages" :key="image.id" class="overflow-hidden rounded-md">
                  <img :src="image.imageUrl" :alt="image.label || 'Inspiration image'" class="aspect-square w-full object-cover" loading="lazy" />
                  <figcaption v-if="image.label" class="mt-1 truncate text-[10px]" :style="{ color: 'var(--p-muted)' }">
                    {{ image.label }}
                  </figcaption>
                </figure>
              </div>
            </section>

            <!-- Delivery -->
            <section id="delivery" class="scroll-mt-5 border-t py-10" :style="{ borderColor: 'var(--p-border)' }">
              <div class="mb-6">
                <h2 class="text-sm font-semibold">Delivery</h2>
                <p class="mt-1 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                  Your published gallery and external delivery links.
                </p>
              </div>

              <div class="grid gap-8 lg:grid-cols-2">
                <div>
                  <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-xs font-semibold">Client gallery</h3>
                    <RouterLink
                      v-if="portalData.gallery"
                      :to="galleryRoute(portalData.gallery.id)"
                      class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
                      :style="{ color: 'var(--p-accent)' }"
                    >
                      Open gallery <ExternalLink class="h-3 w-3" />
                    </RouterLink>
                  </div>
                  <p v-if="!portalData.gallery" class="rounded-lg border border-dashed p-6 text-xs" :style="{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }">
                    No published client gallery yet.
                  </p>
                  <RouterLink v-else :to="galleryRoute(portalData.gallery.id)" class="block">
                    <p class="mb-3 text-sm font-medium">{{ portalData.gallery.title }}</p>
                    <div v-if="portalData.gallery.preview.length" class="grid grid-cols-3 gap-2">
                      <img
                        v-for="media in portalData.gallery.preview"
                        :key="media.id"
                        :src="media.url"
                        :alt="media.label || portalData.gallery.title"
                        class="aspect-square w-full rounded-md object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div v-else-if="portalData.gallery.coverUrl" class="overflow-hidden rounded-md">
                      <img :src="portalData.gallery.coverUrl" :alt="portalData.gallery.title" class="aspect-video w-full object-cover" loading="lazy" />
                    </div>
                  </RouterLink>
                </div>

                <div>
                  <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-xs font-semibold">Delivery links</h3>
                    <span class="text-[10px] uppercase tracking-[0.16em]" :style="{ color: 'var(--p-muted)' }">
                      {{ portalData.deliveryLinks.length }} links
                    </span>
                  </div>
                  <p v-if="!portalData.deliveryLinks.length" class="rounded-lg border border-dashed p-6 text-xs" :style="{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }">
                    No delivery links available yet.
                  </p>
                  <div v-else class="divide-y" :style="{ borderColor: 'var(--p-border)' }">
                    <a
                      v-for="link in portalData.deliveryLinks"
                      :key="link.id"
                      :href="link.url"
                      target="_blank"
                      class="group flex items-center gap-4 py-4"
                    >
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }">
                        <Link class="h-4 w-4" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-xs font-medium">{{ link.name }}</span>
                        <span class="mt-1 block text-[10px]" :style="{ color: 'var(--p-muted)' }">
                          {{ link.expiresAt ? `Expires ${formatDate(link.expiresAt)}` : "Open access" }}
                        </span>
                      </span>
                      <ExternalLink class="h-3.5 w-3.5 transition group-hover:translate-x-0.5" :style="{ color: 'var(--p-muted)' }" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <!-- Documents -->
            <section id="documents" class="scroll-mt-5 border-t py-10" :style="{ borderColor: 'var(--p-border)' }">
              <div class="mb-5 flex items-end justify-between">
                <div>
                  <h2 class="text-sm font-semibold">Documents</h2>
                  <p class="mt-1 text-[11px]" :style="{ color: 'var(--p-muted)' }">
                    Contracts and files shared for your event.
                  </p>
                </div>
                <span class="text-[10px] uppercase tracking-[0.18em]" :style="{ color: 'var(--p-muted)' }">
                  {{ portalData.contracts.length }} items
                </span>
              </div>
              <p v-if="!portalData.contracts.length" class="py-6 text-sm" :style="{ color: 'var(--p-muted)' }">
                No documents shared yet.
              </p>
              <div v-else class="divide-y" :style="{ borderColor: 'var(--p-border)' }">
                <a
                  v-for="document in portalData.contracts"
                  :key="document.id"
                  href="#"
                  class="group flex items-center gap-4 py-4"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
                  >
                    <FileText class="h-4 w-4" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-xs font-medium">{{ document.title }}</span>
                    <span class="mt-1 block text-[10px] capitalize" :style="{ color: 'var(--p-muted)' }">
                      {{ document.status }}
                    </span>
                  </span>
                  <ExternalLink
                    class="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                    :style="{ color: 'var(--p-muted)' }"
                  />
                </a>
              </div>
            </section>
          </main>

          <footer class="border-t" :style="{ borderColor: 'var(--p-border)' }">
            <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div class="flex items-center gap-2">
                <Aperture class="h-5 w-5" :style="{ color: 'var(--p-accent)' }" />
                <span class="text-xs font-semibold">{{ portalData.studio.name }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-4">
                <button
                  v-if="portalData.hasPasscode"
                  type="button"
                  class="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]"
                  :style="{ color: 'var(--p-muted)' }"
                  @click="isChangePasscodeOpen = true"
                >
                  <KeyRound class="h-3.5 w-3.5" /> Change passcode
                </button>
                <a
                  v-if="studioWhatsApp"
                  :href="studioWhatsApp"
                  target="_blank"
                  class="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]"
                  :style="{ color: 'var(--p-muted)' }"
                >
                  <MessageCircle class="h-3.5 w-3.5" /> Contact studio
                </a>
              </div>
            </div>
          </footer>
        </div>

        <!-- Bottom navigation -->
        <nav
          class="fixed inset-x-0 bottom-0 z-40 border-t px-3 py-2 backdrop-blur-xl"
          :style="{
            background: 'color-mix(in srgb, var(--p-bg) 90%, transparent)',
            borderColor: 'var(--p-border)',
          }"
          aria-label="Portal sections"
        >
          <div class="mx-auto grid max-w-6xl grid-cols-5">
            <a
              v-for="item in portalNavigation"
              :key="item.label"
              :href="item.href"
              class="group flex flex-col items-center justify-center gap-1.5 rounded-lg py-2 text-[9px] font-semibold uppercase tracking-[0.13em] transition hover:bg-[var(--p-hover)]"
              :style="{ color: 'var(--p-muted)' }"
            >
              <component :is="item.icon" class="h-4 w-4 transition group-hover:text-[var(--p-accent)]" />
              {{ item.label }}
            </a>
          </div>
        </nav>
      </template>
    </div>

    <PortalPasscodeDialog
      :open="isPasscodePromptOpen"
      mode="unlock"
      :loading="isSubmittingPasscode"
      :gate="portalGate"
      @update:open="handlePasscodePromptOpen"
      @submit="handlePasscodeSubmit"
    />
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
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Aperture,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  Home,
  KeyRound,
  Link,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Phone,
  ReceiptText,
  Share2,
  Sun,
} from "lucide-vue-next";
import PortalInstallHelpDialog from "@/components/portal/PortalInstallHelpDialog.vue";
import PortalInvoicePdfDialog from "@/components/portal/PortalInvoicePdfDialog.vue";
import PortalPasscodeDialog from "@/components/portal/PortalPasscodeDialog.vue";
import {
  PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
  usePortalInstall,
} from "@/composables/usePortalInstall";
import {
  PortalApiError,
  portalService,
  type CreatePortalCheckoutRequest,
  type PortalAccessGate,
  type PortalData,
  type PortalInvoice,
} from "@/services/portal.service";
import {
  blendPortalHex,
  deriveAccessiblePortalAccent,
  normalizePortalHex,
  portalHexToRgba,
  readablePortalAccentText,
} from "@/utils/portal-color";

const route = useRoute();
const router = useRouter();
const {
  isIosSafari,
  isStandalone,
  canPromptInstall,
  requestInstall,
} = usePortalInstall();
type PortalPasscodeSubmit =
  | { mode: "unlock"; passcode: string }
  | { mode: "change"; currentPasscode: string; newPasscode: string };

const isDark = ref(true);
const isLoading = ref(true);
const accessExpired = ref(false);
const error = ref<string | null>(null);
const notice = ref("");
const portalData = ref<PortalData | null>(null);
const portalGate = ref<PortalAccessGate | null>(null);
const portalShareUrl = ref("");
const pendingToken = ref("");
const isPasscodePromptOpen = ref(false);
const isSubmittingPasscode = ref(false);
const isChangePasscodeOpen = ref(false);
const isChangingPasscode = ref(false);
const selectedInvoice = ref<PortalInvoice | null>(null);
const isInvoicePdfOpen = ref(false);
const isInstallHelpOpen = ref(false);
const hasDifferentSavedPortal = ref(false);
const activeCheckout = ref<string | null>(null);
const actionsOpen = ref(false);
const actionsMenuEl = ref<HTMLElement | null>(null);
let noticeTimer = 0;
const portalNavigation = [
  { label: "Home", href: "#home", icon: Home },
  { label: "Sessions", href: "#sessions", icon: CalendarDays },
  { label: "Billing", href: "#billing", icon: ReceiptText },
  { label: "Delivery", href: "#delivery", icon: Link },
  { label: "Documents", href: "#documents", icon: FileText },
];

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatMoney = (value: number, currency: string | null) => {
  if (!currency) return value.toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-MY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
};

const paidPercent = computed(() => {
  if (!portalData.value) return 0;
  const { totalInvoiced, totalPaid } = portalData.value.billing;
  return totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
});

const primarySession = computed(() => portalData.value?.sessions[0] ?? null);
const currentJobId = computed(() => String(route.params.jobId || ""));
const galleryRoute = (galleryId: string) => ({
  name: "client-portal-gallery",
  params: { jobId: currentJobId.value, galleryId },
  query: route.query,
});
const portalHeroImage = computed(
  () =>
    portalData.value?.portalHeroUrl
    ?? portalData.value?.gallery?.coverUrl
    ?? portalData.value?.gallery?.preview?.[0]?.url
    ?? portalData.value?.inspirationImages?.[0]?.imageUrl
    ?? "",
);

const jobSteps = computed(() => {
  const status = portalData.value?.status ?? "";
  const statusOrder = ["inquiry", "booked", "confirmed", "in_production", "delivered", "completed"];
  const idx = statusOrder.indexOf(status);
  return [
    { label: "Confirmed", note: "Booking secured", done: idx >= 2 },
    { label: "Shoot Completed", note: "Session wrapped", done: idx >= 3 },
    { label: "Editing", note: "Post-production done", done: idx >= 4 },
    { label: "Delivery Ready", note: "Pending final payment", done: idx >= 5 },
  ];
});

const studioWhatsApp = computed(() => {
  const phone = portalData.value?.studio.whatsapp;
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}`;
});

interface PortalLoadContext {
  generation: number;
  jobId: string;
  token: string;
  controller: AbortController;
}

let loadGeneration = 0;
let loadController: AbortController | null = null;
let checkoutRequestId = 0;
let checkoutController: AbortController | null = null;
let paymentReturnRequestId = 0;
let paymentReturnController: AbortController | null = null;
let handledPaymentReturnKey = "";
let suppressedCleanup:
  | { generation: number; jobId: string }
  | null = null;
const PAYMENT_POLL_INTERVAL_MS = 2_000;
const PAYMENT_POLL_TIMEOUT_MS = 60_000;

function showNotice(message: string) {
  notice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 3500);
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!actionsOpen.value) return;
  const el = actionsMenuEl.value;
  if (el && event.target instanceof Node && el.contains(event.target)) return;
  actionsOpen.value = false;
}

function runPortalAction(action: () => void | Promise<void>) {
  actionsOpen.value = false;
  void action();
}

function getRouteToken(): string {
  const tokenQuery = route.query.token;
  return Array.isArray(tokenQuery)
    ? String(tokenQuery[0] || "")
    : String(tokenQuery || "");
}

function getPaymentIntentId(): string {
  const value = route.query.intentId;
  const intentId = Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intentId)
    ? intentId
    : "";
}

function isCurrentLoad(context: PortalLoadContext): boolean {
  return (
    context.generation === loadGeneration
    && !context.controller.signal.aborted
  );
}

function getSafeErrorMessage(value: unknown, fallback: string): string {
  if (
    value instanceof PortalApiError
    && !value.code
    && value.status > 0
    && value.message
  ) {
    return value.message;
  }
  return fallback;
}

function resetPortalState() {
  checkoutRequestId += 1;
  checkoutController?.abort();
  checkoutController = null;
  paymentReturnRequestId += 1;
  paymentReturnController?.abort();
  paymentReturnController = null;
  handledPaymentReturnKey = "";
  portalData.value = null;
  portalGate.value = null;
  portalShareUrl.value = "";
  pendingToken.value = "";
  isPasscodePromptOpen.value = false;
  isSubmittingPasscode.value = false;
  isChangePasscodeOpen.value = false;
  isChangingPasscode.value = false;
  selectedInvoice.value = null;
  isInvoicePdfOpen.value = false;
  isInstallHelpOpen.value = false;
  activeCheckout.value = null;
  actionsOpen.value = false;
  accessExpired.value = false;
  error.value = null;
  isLoading.value = true;
}

function markAccessExpired(context: PortalLoadContext) {
  if (!isCurrentLoad(context)) return;
  accessExpired.value = true;
  error.value = null;
  portalData.value = null;
  portalGate.value = null;
  pendingToken.value = "";
  isPasscodePromptOpen.value = false;
  isLoading.value = false;
}

function markLoadError(
  context: PortalLoadContext,
  caught: unknown,
  fallback: string,
) {
  if (!isCurrentLoad(context)) return;
  error.value = getSafeErrorMessage(caught, fallback);
  accessExpired.value = false;
  portalData.value = null;
  portalGate.value = null;
  pendingToken.value = "";
  isPasscodePromptOpen.value = false;
  isLoading.value = false;
}

function handlePasscodePromptOpen(open: boolean) {
  isPasscodePromptOpen.value = open;
}

async function removeTokenFromUrl(
  context: PortalLoadContext,
): Promise<boolean> {
  if (
    !isCurrentLoad(context)
    || String(route.params.jobId || "") !== context.jobId
    || getRouteToken() !== context.token
  ) {
    return false;
  }

  const query = { ...route.query };
  delete query.token;
  suppressedCleanup = {
    generation: context.generation,
    jobId: context.jobId,
  };

  try {
    const failure = await router.replace({
      path: route.path,
      query,
      hash: route.hash,
    });
    if (failure) throw failure;
  } catch (caught: unknown) {
    if (isCurrentLoad(context)) suppressedCleanup = null;
    throw caught;
  }

  return isCurrentLoad(context);
}

function applyPortalData(context: PortalLoadContext, data: PortalData) {
  if (!isCurrentLoad(context)) return;
  if (!portalShareUrl.value) portalShareUrl.value = data.shareUrl;
  data.shareUrl = portalShareUrl.value;
  portalData.value = data;
  portalGate.value = null;
  accessExpired.value = false;
  error.value = null;
  isLoading.value = false;
  void handlePaymentReturn(context);
}

async function fetchPortalData(context: PortalLoadContext) {
  try {
    const data = await portalService.getPortalData(context.jobId, {
      signal: context.controller.signal,
    });
    applyPortalData(context, data);
  } catch (caught: unknown) {
    if (!isCurrentLoad(context)) return;
    if (caught instanceof PortalApiError && caught.status === 401) {
      markAccessExpired(context);
      return;
    }
    markLoadError(context, caught, "Failed to load portal data.");
  }
}

async function exchangeAndLoad(
  context: PortalLoadContext,
  submittedPasscode?: string,
) {
  let response;
  try {
    response = await portalService.exchangeSession(
      context.jobId,
      {
        token: context.token,
        ...(submittedPasscode ? { passcode: submittedPasscode } : {}),
      },
      { signal: context.controller.signal },
    );
  } catch (caught: unknown) {
    if (!isCurrentLoad(context)) return;

    if (
      submittedPasscode
      && caught instanceof PortalApiError
      && caught.code === "PORTAL_PASSCODE_INCORRECT"
    ) {
      isLoading.value = false;
      isPasscodePromptOpen.value = true;
      showNotice("Incorrect passcode. Please try again.");
      return;
    }

    if (
      caught instanceof PortalApiError
      && (
        caught.code === "PORTAL_TOKEN_INVALID"
        || caught.status === 401
      )
    ) {
      markAccessExpired(context);
      return;
    }

    markLoadError(context, caught, "Failed to open this portal.");
    return;
  }

  if (!isCurrentLoad(context)) return;
  if (response.status === "passcode_required") {
    pendingToken.value = context.token;
    portalGate.value = response.gate;
    isPasscodePromptOpen.value = true;
    isLoading.value = false;
    return;
  }

  portalShareUrl.value = response.shareUrl;
  pendingToken.value = "";
  portalGate.value = null;
  isPasscodePromptOpen.value = false;

  try {
    const cleaned = await removeTokenFromUrl(context);
    if (!cleaned) return;
  } catch (caught: unknown) {
    markLoadError(
      context,
      caught,
      "Portal opened, but the access link could not be secured.",
    );
    return;
  }

  await fetchPortalData(context);
}

function startPortalLoad(jobId: string, token: string) {
  loadController?.abort();
  suppressedCleanup = null;
  const controller = new AbortController();
  loadController = controller;
  const context: PortalLoadContext = {
    generation: ++loadGeneration,
    jobId,
    token,
    controller,
  };
  resetPortalState();

  if (!jobId) {
    error.value = "No job ID provided.";
    isLoading.value = false;
    return;
  }

  if (token) {
    void exchangeAndLoad(context);
  } else {
    void fetchPortalData(context);
  }
}

function openInvoicePdf(invoice: PortalInvoice) {
  selectedInvoice.value = invoice;
  isInvoicePdfOpen.value = true;
}

function handleInvoicePdfOpen(open: boolean) {
  isInvoicePdfOpen.value = open;
  if (!open) selectedInvoice.value = null;
}

async function writePortalLinkToClipboard(): Promise<void> {
  const shareUrl = portalShareUrl.value;
  if (!shareUrl) throw new Error("Portal link is unavailable.");

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return;
    } catch {
      // Fall through for browsers that block the Clipboard API.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = shareUrl;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textArea.remove();
  }
  if (!copied) throw new Error("Portal link could not be copied.");
}

async function copyPortalLink() {
  try {
    await writePortalLinkToClipboard();
    showNotice("Portal link copied.");
  } catch {
    showNotice("Unable to copy the portal link.");
  }
}

async function sharePortal() {
  const shareUrl = portalShareUrl.value;
  if (!shareUrl) {
    showNotice("Portal link is unavailable.");
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: portalData.value?.title ?? "Client portal",
        text: portalData.value
          ? `Open your ${portalData.value.studio.name} client portal.`
          : "Open your client portal.",
        url: shareUrl,
      });
      return;
    } catch (caught: unknown) {
      if (isShareCancellation(caught)) return;
    }
  }

  try {
    await writePortalLinkToClipboard();
    showNotice("Sharing unavailable. Portal link copied.");
  } catch {
    showNotice("Unable to share the portal link.");
  }
}

function isShareCancellation(caught: unknown): boolean {
  if (!caught || typeof caught !== "object") return false;
  const error = caught as { name?: unknown; code?: unknown };
  return (
    error.name === "AbortError"
    || error.code === 20
    || error.code === "ABORT_ERR"
  );
}

async function savePortalToHomeScreen() {
  const jobId = portalData.value?.jobId;
  if (!jobId) {
    showNotice("Unable to prepare this portal for installation.");
    return;
  }

  if (isStandalone.value) return;

  if (!canPromptInstall.value) {
    if (showDifferentSavedPortalHelp(jobId)) return;
    if (isIosSafari.value && !rememberPortalInstallJob(jobId)) return;
    hasDifferentSavedPortal.value = false;
    isInstallHelpOpen.value = true;
    return;
  }

  if (!rememberPortalInstallJob(jobId)) {
    if (hasDifferentSavedPortal.value) isInstallHelpOpen.value = true;
    return;
  }

  const result = await requestInstall();
  if (result === "accepted") {
    showNotice("Portal added to your device.");
  } else if (result === "dismissed") {
    forgetPortalInstallJob(jobId);
  } else if (result === "unavailable") {
    forgetPortalInstallJob(jobId);
    isInstallHelpOpen.value = true;
  }
}

function rememberPortalInstallJob(jobId: string): boolean {
  try {
    const savedJobId = localStorage.getItem(
      PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
    );
    if (savedJobId && savedJobId !== jobId) {
      hasDifferentSavedPortal.value = true;
      return false;
    }
    localStorage.setItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY, jobId);
    hasDifferentSavedPortal.value = false;
    return true;
  } catch {
    showNotice("Browser storage is blocked. This portal cannot be installed.");
    return false;
  }
}

function showDifferentSavedPortalHelp(jobId: string): boolean {
  try {
    const savedJobId = localStorage.getItem(
      PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
    );
    hasDifferentSavedPortal.value = Boolean(
      savedJobId && savedJobId !== jobId,
    );
    if (hasDifferentSavedPortal.value) {
      isInstallHelpOpen.value = true;
    }
    return hasDifferentSavedPortal.value;
  } catch {
    return false;
  }
}

function forgetPortalInstallJob(jobId: string) {
  try {
    if (localStorage.getItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY) === jobId) {
      localStorage.removeItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY);
    }
  } catch {
    // Storage cleanup is best-effort after a failed or dismissed prompt.
  }
}

async function startCheckout(payload: CreatePortalCheckoutRequest) {
  if (activeCheckout.value || !portalData.value) return;
  if (payload.scope === "all" && !portalData.value.billing.canPayAll) return;
  const jobId = currentJobId.value;
  const generation = loadGeneration;
  const actionKey =
    payload.scope === "all" ? "all" : `invoice:${payload.invoiceId}`;
  const requestId = ++checkoutRequestId;
  checkoutController?.abort();
  const controller = new AbortController();
  checkoutController = controller;
  activeCheckout.value = actionKey;

  try {
    const intent = await portalService.createCheckout(jobId, payload, {
      signal: controller.signal,
    });
    if (
      requestId !== checkoutRequestId
      || controller.signal.aborted
      || generation !== loadGeneration
      || currentJobId.value !== jobId
    ) {
      return;
    }
    if (!intent.checkoutUrl) {
      throw new Error("Checkout is unavailable. Please try again.");
    }
    const checkoutUrl = new URL(intent.checkoutUrl, window.location.origin);
    if (!["http:", "https:"].includes(checkoutUrl.protocol)) {
      throw new Error("Checkout returned an invalid URL.");
    }
    window.location.assign(checkoutUrl.href);
  } catch (caught: unknown) {
    if (
      requestId === checkoutRequestId
      && !controller.signal.aborted
      && generation === loadGeneration
      && currentJobId.value === jobId
    ) {
      showNotice(getSafeErrorMessage(caught, "Unable to start checkout."));
    }
  } finally {
    if (requestId === checkoutRequestId) {
      checkoutController = null;
      activeCheckout.value = null;
    }
  }
}

async function cleanPaymentIntentQuery(
  context: PortalLoadContext,
  intentId: string,
  requestId: number,
): Promise<boolean> {
  if (
    !isCurrentLoad(context)
    || requestId !== paymentReturnRequestId
    || currentJobId.value !== context.jobId
    || getPaymentIntentId() !== intentId
  ) {
    return false;
  }

  const query = { ...route.query };
  delete query.intentId;
  const failure = await router.replace({
    path: route.path,
    query,
    hash: route.hash,
  });
  if (failure) throw failure;

  return (
    isCurrentLoad(context)
    && requestId === paymentReturnRequestId
    && currentJobId.value === context.jobId
  );
}

function waitForPaymentPoll(
  delayMs: number,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let timer = 0;
    const handleAbort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
      resolve(false);
    };
    timer = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve(true);
    }, delayMs);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

async function handlePaymentReturn(context: PortalLoadContext) {
  // Capture once. Query cleanup must not become the source of payment truth.
  const intentId = getPaymentIntentId();
  if (!intentId || !isCurrentLoad(context)) return;
  const returnKey = `${context.jobId}:${intentId}`;
  if (handledPaymentReturnKey === returnKey) return;

  const requestId = ++paymentReturnRequestId;
  paymentReturnController?.abort();
  const controller = new AbortController();
  paymentReturnController = controller;
  handledPaymentReturnKey = returnKey;
  let timedOut = false;
  const timeoutTimer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PAYMENT_POLL_TIMEOUT_MS);
  const cleanupResult = cleanPaymentIntentQuery(
    context,
    intentId,
    requestId,
  )
    .then((cleaned) => ({ cleaned, failed: false }))
    .catch(() => ({ cleaned: false, failed: true }));
  let intentStatus: Awaited<ReturnType<typeof portalService.getPaymentIntent>> | null = null;

  try {
    const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS;
    do {
      intentStatus = await portalService.getPaymentIntent(
        context.jobId,
        intentId,
        { signal: controller.signal },
      );
      if (
        requestId !== paymentReturnRequestId
        || controller.signal.aborted
        || !isCurrentLoad(context)
      ) {
        return;
      }
      if (intentStatus.status !== "pending" || Date.now() >= deadline) break;
      const shouldContinue = await waitForPaymentPoll(
        Math.min(PAYMENT_POLL_INTERVAL_MS, deadline - Date.now()),
        controller.signal,
      );
      if (!shouldContinue) return;
    } while (Date.now() < deadline);

    if (intentStatus.status === "succeeded") {
      showNotice("Payment received. Thank you.");
      await fetchPortalData(context);
    } else if (intentStatus.status === "pending") {
      showNotice("Payment is still processing.");
    } else if (intentStatus.status === "cancelled") {
      showNotice("Payment was cancelled.");
    } else if (intentStatus.status === "expired") {
      showNotice("This checkout has expired.");
    } else {
      showNotice("Payment was not completed.");
    }
  } catch (caught: unknown) {
    if (
      timedOut
      && requestId === paymentReturnRequestId
      && isCurrentLoad(context)
    ) {
      showNotice("Payment is still processing.");
      return;
    }
    if (
      requestId !== paymentReturnRequestId
      || controller.signal.aborted
      || !isCurrentLoad(context)
    ) {
      return;
    }
    showNotice(getSafeErrorMessage(caught, "Unable to confirm payment status."));
  } finally {
    window.clearTimeout(timeoutTimer);
    const cleanup = await cleanupResult;
    if (
      cleanup.failed
      && requestId === paymentReturnRequestId
      && !controller.signal.aborted
      && isCurrentLoad(context)
      && getPaymentIntentId() === intentId
    ) {
      showNotice("Payment checked, but the return URL could not be cleaned.");
    }
    if (requestId === paymentReturnRequestId) {
      paymentReturnController = null;
    }
  }
}

async function submitUnlockPasscode(submittedPasscode: string) {
  if (
    submittedPasscode.length < 4
    || !pendingToken.value
    || isSubmittingPasscode.value
    || !loadController
  ) {
    return;
  }

  const context: PortalLoadContext = {
    generation: loadGeneration,
    jobId: String(route.params.jobId || ""),
    token: pendingToken.value,
    controller: loadController,
  };
  isSubmittingPasscode.value = true;
  isLoading.value = true;
  try {
    await exchangeAndLoad(context, submittedPasscode);
  } finally {
    if (isCurrentLoad(context)) isSubmittingPasscode.value = false;
  }
}

async function submitChangedPasscode(
  currentPasscode: string,
  newPasscode: string,
) {
  if (isChangingPasscode.value || !loadController) return;
  const context: PortalLoadContext = {
    generation: loadGeneration,
    jobId: currentJobId.value,
    token: "",
    controller: loadController,
  };
  isChangingPasscode.value = true;
  try {
    const response = await portalService.changePasscode(
      context.jobId,
      { currentPasscode, newPasscode },
      { signal: context.controller.signal },
    );
    if (!isCurrentLoad(context)) return;
    portalShareUrl.value = response.shareUrl;
    if (portalData.value) portalData.value.shareUrl = response.shareUrl;
    isChangePasscodeOpen.value = false;
    showNotice("Portal passcode changed.");
  } catch (caught: unknown) {
    if (!isCurrentLoad(context)) return;
    if (
      caught instanceof PortalApiError
      && caught.code === "PORTAL_CURRENT_PASSCODE_INCORRECT"
    ) {
      showNotice("Current passcode is incorrect.");
      return;
    }
    showNotice(getSafeErrorMessage(caught, "Failed to change portal passcode."));
  } finally {
    if (isCurrentLoad(context)) isChangingPasscode.value = false;
  }
}

function handlePasscodeSubmit(payload: PortalPasscodeSubmit) {
  if (payload.mode === "unlock") {
    void submitUnlockPasscode(payload.passcode);
    return;
  }
  void submitChangedPasscode(payload.currentPasscode, payload.newPasscode);
}

watch(actionsOpen, (open) => {
  if (typeof document === "undefined") return;
  if (open) {
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
  } else {
    document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  }
});

watch(
  [() => String(route.params.jobId || ""), getRouteToken],
  ([jobId, token]) => {
    if (
      suppressedCleanup
      && suppressedCleanup.generation === loadGeneration
      && suppressedCleanup.jobId === jobId
      && token === ""
    ) {
      suppressedCleanup = null;
      return;
    }
    startPortalLoad(jobId, token);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  loadGeneration += 1;
  loadController?.abort();
  loadController = null;
  suppressedCleanup = null;
  window.clearTimeout(noticeTimer);
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  resetPortalState();
});

const themeVars = computed(() => {
  const palette = isDark.value
    ? {
        "--p-shell": "#070909",
        "--p-bg": "#0a0c0c",
        "--p-text": "#f2f5f3",
        "--p-card": "#0e1110",
        "--p-border": "rgba(255,255,255,0.08)",
        "--p-muted": "rgba(255,255,255,0.46)",
        "--p-hover": "rgba(255,255,255,0.05)",
        "--p-status": "rgba(137,104,37,0.13)",
        "--p-status-border": "rgba(228,180,76,0.22)",
      }
    : {
        "--p-shell": "#ddd9d1",
        "--p-bg": "#f3f0ea",
        "--p-text": "#1c1c1a",
        "--p-card": "#ffffff",
        "--p-border": "rgba(0,0,0,0.09)",
        "--p-muted": "rgba(0,0,0,0.48)",
        "--p-hover": "rgba(27,59,54,0.06)",
        "--p-status": "rgba(201,183,156,0.22)",
        "--p-status-border": "rgba(137,104,37,0.22)",
      };
  const brandAccent =
    normalizePortalHex(portalData.value?.accentColor)
    ?? (isDark.value ? "#16D69B" : "#1B3B36");
  const tintAlpha = isDark.value ? 0.1 : 0.08;
  const statusSurface = blendPortalHex(
    isDark.value ? "#896825" : "#C9B79C",
    palette["--p-bg"],
    isDark.value ? 0.13 : 0.22,
  );
  const accent = deriveAccessiblePortalAccent(
    brandAccent,
    [
      palette["--p-shell"],
      palette["--p-bg"],
      palette["--p-card"],
      statusSurface,
    ],
    tintAlpha,
  );

  return {
    ...palette,
    "--p-accent": accent,
    "--p-accent-text": readablePortalAccentText(accent),
    "--p-accent-bg": portalHexToRgba(accent, tintAlpha),
    "--p-accent-border": accent,
  };
});
</script>

<style scoped>
.portal {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}

.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.portal-reveal-late {
  animation-delay: 120ms;
}

@keyframes portal-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .portal-reveal {
    animation: none;
  }
}
</style>
