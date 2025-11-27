# Multi-Language Implementation Instructions

## Context
A multi-language system has been set up for the end-user booking application. The foundation is complete:
- ✅ Translation types defined in `src/locales/types.ts`
- ✅ Translations created in `src/locales/translations.ts` (BM & EN)
- ✅ `useTranslation` composable created in `src/composables/useTranslation.ts`

## What Needs to Be Done
Update all pages and components to use the translation system for **fixed UI text only**. Do NOT translate dynamic content from mock data (studio names, theme names, descriptions, etc.).

---

## How to Use the Translation System

### 1. Import the composable in the `<script setup>` section:
```typescript
import { useTranslation } from '@/composables/useTranslation';

const { t, currentLang } = useTranslation();
```

### 2. Replace hard-coded text with translation keys:
```vue
<!-- BEFORE -->
<button>Book Now</button>
<label>Full Name</label>

<!-- AFTER -->
<button>{{ t('bookNow') }}</button>
<label>{{ t('fullName') }}</label>
```

### 3. For attributes/props, use `:attribute` binding:
```vue
<!-- BEFORE -->
<input placeholder="Enter your name" />

<!-- AFTER -->
<input :placeholder="t('enterFullName')" />
```

---

## Files to Update (in order of priority)

### High Priority (Update these first):

#### 1. `src/pages/studio-not-found.vue`
- Line 60: "Studio Not Found" → `{{ t('studioNotFoundTitle') }}`
- Line 62-64: Message → `{{ t('studioNotFoundMessage') }}`
- Line 76: "Possible Reasons:" → `{{ t('possibleReasons') }}`
- Lines 82, 91, 100, 109: Reasons 1-4 → Use `studioNotFoundReason1-4`
- Line 128: "Home Page" → `{{ t('homePage') }}`
- Line 134: Footer text → `{{ t('contactStudioDirectly') }}`

#### 2. `src/pages/home/index.vue`
- Hero section buttons
- "Book Now", "Check Booking"
- "Available Themes" heading
- Any other fixed UI text

#### 3. `src/pages/booking/index.vue` (LARGEST FILE - many translations)
**Header Section:**
- Line 516: "Back" → `{{ t('back') }}`
- Line 536: "Booking at" → `{{ t('bookingAt') }}`

**Step Indicators (Progress Bar):**
- Lines ~632-683: Use `step`, `dateAndTime`, `customizeSession`, `customerInformation`

**Date & Time Selection:**
- Line 813-817: Title/subtitle → Use `chooseDateTimeTitle`, `chooseDateTimeSubtitle`
- Line 823: Month/year header (keep as-is, uses date-fns)
- Line 923: "Select Time Slot" → `{{ t('selectTimeSlot') }}`
- Lines 983-985: "No available slots" → `{{ t('noSlotsAvailable') }}`

**Navigation Buttons:**
- Line 1094: "Back" → `{{ t('back') }}`
- Line 1104: "Continue" → `{{ t('continue') }}`

**Pax Selection:**
- Line 1126: "Number of People" → `{{ t('numberOfPeople') }}`
- Line 1130: "Base: X pax (included)" → Use `base`, `pax`, `baseIncluded`

**Customer Form:**
- Line 1346: "Full Name *" → `{{ t('fullName') }} *`
- Line 1351: placeholder → `:placeholder="t('enterFullName')"`
- Line 1370: "WhatsApp Number *" → `{{ t('whatsappNumber') }} *`
- Line 1376: placeholder → `:placeholder="t('enterPhone')"`
- Line 1395: "Email Address *" → `{{ t('emailAddress') }} *`
- Line 1401: placeholder → `:placeholder="t('enterEmail')"`
- Line 1420: "Notes (Optional)" → `{{ t('notesOptional') }}`
- Line 1425: placeholder → `:placeholder="t('specialRequests')"`

**Summary Sidebar:**
- Line 1526: "Summary" → `{{ t('summary') }}`
- Line 1575: "Base (X pax)" → Use template: `{{ t('base') }} ({{ selectedTheme?.base_pax }} {{ t('pax') }})`
- Line 1638: "Total" → `{{ t('total') }}`
- Line 1643: "Deposit (50%)" → `{{ t('deposit') }} (50%)`
- Line 1653: "Balance" → `{{ t('balance') }}`

**Cart Sidebar:**
- Line 1694: "Your Cart" → `{{ t('yourCart') }}`
- Line 1738: "Your cart is empty" → `{{ t('cartEmptyMessage') }}`
- Line 1748: "Start Booking" → `{{ t('startBooking') }}`
- Line 1863: "Subtotal" → `{{ t('subtotal') }}`
- Line 1872: "Deposit Required" → `{{ t('depositRequired') }}`
- Line 1878: "Pay 50% now..." → `{{ t('payNowBalanceAtStudio') }}`
- Line 1889: "Proceed to Checkout" → `{{ t('proceedToCheckout') }}`

#### 4. `src/pages/success/index.vue`
**Main Headings:**
- Success message: `{{ t('bookingSuccessful') }}`
- Thank you message: `{{ t('thankYouMessage') }}`

**Booking Details:**
- "Booking Number" → `{{ t('bookingNumber') }}`
- "Date" → `{{ t('date') }}`
- "Time" → `{{ t('time') }}`
- "People" → `{{ t('people') }}`

**What's Next Section:**
- "What's Next?" → `{{ t('whatNext') }}`
- "Arrive on time" → `{{ t('arriveOnTime') }}`
- Description → `{{ t('arriveOnTimeDesc') }}`
- "Bring payment" → `{{ t('bringPayment') }}`
- Description → `{{ t('bringPaymentDesc') }}`
- "Have questions?" → `{{ t('questions') }}`
- Description → `{{ t('questionsDesc') }}`

**Action Buttons:**
- "Contact Studio" → `{{ t('contactStudio') }}`
- "Download Receipt" → `{{ t('downloadReceipt') }}`
- "Back to Home" → `{{ t('backToHome') }}`

**Pricing Summary:**
- "Total" → `{{ t('total') }}`
- "Deposit Paid" → `{{ t('depositPaid') }}`
- "Remaining Balance" → `{{ t('remainingBalance') }}`

#### 5. `src/pages/home/lookup.vue`
**Header:**
- Line 145: "Check Your Booking" → `{{ t('checkYourBooking') }}`
- Line 146: Subtitle → `{{ t('checkBookingSubtitle') }}`

**Form Labels:**
- Line 157: "Booking ID" → `{{ t('bookingId') }}`
- Line 161: placeholder → `:placeholder="t('enterBookingId')"`
- Line 172: "Phone Number" → `{{ t('phoneNumber') }}`
- Line 176: placeholder → `:placeholder="t('enterPhone')"`

**Buttons:**
- Line 191: "Check Booking" / "Searching..." → Use ternary with `t('checkBookingButton')` / `t('searching')`

**Booking Details Display:**
- Line 226: "Booking Number" → `{{ t('bookingNumber') }}`
- Line 261: "People" → `{{ t('people') }}`
- Line 269: "Add-ons" → `{{ t('addOns') }}`

**Customer Info Section:**
- "Name", "WhatsApp", "Email" labels
- Line 302: "Total" → `{{ t('total') }}`
- "Deposit Paid" → `{{ t('depositPaid') }}`
- "Remaining Balance" → `{{ t('remainingBalance') }}`

**Status Badges:**
- Use computed function with translation keys: `confirmed`, `pending`, `cancelled`, `completed`

### Medium Priority:

#### 6. `src/pages/theme/details.vue`
- Theme details labels
- "Book Now" button → `{{ t('bookNow') }}`
- Pricing labels: `base`, `extraPax`, `duration`, `minutes`
- "Back" button → `{{ t('back') }}`

#### 7. `src/components/Modal.vue`
- Button text defaults:
  - Line 16: `confirmText: t('ok')`
  - Line 17: `cancelText: t('cancel')`
- Note: Since this is already prop-based, parent components can pass translated text

#### 8. `src/pages/home/not-found.vue`
- "Page Not Found" → `{{ t('pageNotFound') }}`
- Error message text
- "Go Back" button → `{{ t('goBack') }}`

---

## Important Rules

### ✅ DO Translate:
- Buttons: "Book Now", "Continue", "Back", "Submit"
- Labels: "Full Name", "Email", "Phone Number"
- Headings: "Select Theme", "Choose Date & Time"
- Status text: "Available", "Fully Booked", "Confirmed"
- Form placeholders
- Error messages
- Navigation text
- Section titles
- Instructions and helper text
- Calendar day abbreviations (S, M, T, W, T, F, S)

### ❌ DO NOT Translate:
- Studio name (from `studioStore.studio.name`)
- Theme names (from `theme.name`)
- Theme descriptions (from `theme.description_short/long`)
- Add-on names (from `addon.name`)
- Prices/numbers (RM 150)
- User-entered content
- Mock data content
- Date/time values (already handled by date-fns locale)
- Studio address, contact info

---

## Special Cases

### Date/Time Localization
For date formatting, use date-fns locale:

```typescript
import { format } from 'date-fns';
import { enUS, ms } from 'date-fns/locale';

const { currentLang } = useTranslation();
const locale = currentLang.value === 'BM' ? ms : enUS;

// Then use in format
format(date, 'MMMM yyyy', { locale })
```

### Status Badges with Dynamic Classes
Use computed properties:

```typescript
const getStatusText = (status: string) => {
  const statusMap: Record<string, TranslationKey> = {
    confirmed: 'confirmed',
    pending: 'pending',
    cancelled: 'cancelled',
    completed: 'completed'
  };
  return t(statusMap[status] || 'pending');
};
```

### Pluralization
For items that need plural forms:

```typescript
const { t, tp } = useTranslation();

// Simple count display
tp('booking', 1) // "1 booking" or "1 tempahan"
tp('bookings', 2) // "2 bookings" or "2 tempahan"
```

---

## Testing

After implementing translations, test with:

### Test Scenario 1: Bahasa Melayu (Default)
```
URL: http://localhost:5173?studio=najiahstudio
Expected: All UI text in Bahasa Melayu
```

### Test Scenario 2: English
```
URL: http://localhost:5173?studio=arisham
Expected: All UI text in English
(Change arisham's default_language to 'EN' in mockData.ts)
```

### Test Scenario 3: Switch Language
Modify `src/services/mockData.ts`:
```typescript
export const mockStudios: Record<string, Studio> = {
  najiahstudio: {
    // ... other properties
    default_language: 'EN', // Change from 'BM' to 'EN'
  },
};
```

### Verification Checklist:
- [ ] All buttons show translated text
- [ ] Form labels and placeholders are translated
- [ ] Error messages appear in correct language
- [ ] Navigation text is translated
- [ ] Studio name, theme names remain unchanged (from mock data)
- [ ] Prices remain as numbers (RM 150)
- [ ] Dates format according to language locale

---

## Build Command

After all changes:
```bash
cd "/Users/haqeemsolehan/Documents/Booking Raya 2025/end-user"
pnpm run build
```

Check for any TypeScript errors related to translation keys.

---

## Translation Key Reference

All available keys are in `src/locales/types.ts`. Common patterns:

### Navigation & Actions
- `back`, `home`, `homePage`, `continue`, `submit`, `cancel`, `close`, `ok`, `yes`, `no`

### Buttons
- `bookNow`, `startBooking`, `viewDetails`, `checkBooking`, `addToCart`, `proceedToCheckout`

### Form Fields
- `fullName`, `emailAddress`, `whatsappNumber`, `notes`, `notesOptional`
- `enterFullName`, `enterEmail`, `enterPhone`, `enterNotes`, `specialRequests`

### Status & States
- `confirmed`, `pending`, `cancelled`, `completed`, `available`, `fullyBooked`
- `depositPaid`, `fullPayment`, `paymentPending`
- `active`, `inactive`

### Pricing
- `total`, `subtotal`, `deposit`, `balance`, `base`, `extra`, `price`, `free`
- `depositRequired`, `remainingBalance`, `payNowBalanceAtStudio`

### Time & Calendar
- `date`, `time`, `duration`, `minutes`, `mins`
- `selectDate`, `selectTimeSlot`, `availableSlots`, `noSlotsAvailable`, `studioClosed`
- `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
- `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`

### Booking Flow
- `step`, `selectTheme`, `chooseDateAndTime`, `customizeSession`, `customerInformation`
- `selectThemeTitle`, `chooseDateTimeTitle`, `customizeSessionTitle`, `customerInfoTitle`
- `summary`, `bookingSummary`, `bookingDetails`

### Theme & Pax
- `theme`, `basePax`, `extraPax`, `numberOfPeople`, `people`, `pax`, `baseIncluded`
- `addOns`, `optional`, `addToBooking`

### Cart
- `cart`, `yourCart`, `cartEmpty`, `cartEmptyMessage`, `booking`, `bookings`
- `removeFromCart`, `slotHeld`, `timeRemaining`

### Success Page
- `bookingSuccessful`, `bookingConfirmed`, `thankYou`, `thankYouMessage`
- `confirmationSent`, `confirmationSentMessage`, `whatNext`
- `arriveOnTime`, `arriveOnTimeDesc`, `bringPayment`, `bringPaymentDesc`
- `questions`, `questionsDesc`, `contactStudio`, `downloadReceipt`, `backToHome`

### Lookup Page
- `checkYourBooking`, `checkBookingSubtitle`, `bookingId`, `phoneNumber`
- `enterBookingId`, `checkBookingButton`, `searching`
- `bookingNotFound`, `bookingNotFoundMessage`

### Errors
- `studioNotFound`, `pageNotFound`, `somethingWentWrong`, `tryAgain`, `goBack`
- `fieldRequired`, `invalidEmail`, `invalidPhone`
- `studioNotFoundTitle`, `studioNotFoundMessage`, `possibleReasons`
- `studioNotFoundReason1`, `studioNotFoundReason2`, `studioNotFoundReason3`, `studioNotFoundReason4`
- `contactStudioDirectly`

---

## Example Implementation Pattern

### Before:
```vue
<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
</script>

<template>
  <div>
    <h1>Select Your Theme</h1>
    <p>Choose the photography package that suits you</p>

    <label>Full Name</label>
    <input v-model="name" placeholder="Enter your full name" />

    <button>Book Now</button>
    <button>Back</button>

    <!-- Dynamic content - no translation -->
    <h2>{{ studio.name }}</h2>
    <p>{{ theme.description }}</p>
  </div>
</template>
```

### After:
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTranslation } from '@/composables/useTranslation';

const { t, currentLang } = useTranslation();
const name = ref('');
</script>

<template>
  <div>
    <h1>{{ t('selectThemeTitle') }}</h1>
    <p>{{ t('selectThemeSubtitle') }}</p>

    <label>{{ t('fullName') }}</label>
    <input v-model="name" :placeholder="t('enterFullName')" />

    <button>{{ t('bookNow') }}</button>
    <button>{{ t('back') }}</button>

    <!-- Dynamic content - NO translation -->
    <h2>{{ studio.name }}</h2>
    <p>{{ theme.description }}</p>
  </div>
</template>
```

---

## Common Mistakes to Avoid

### ❌ Wrong:
```vue
<!-- Translating dynamic content -->
<h2>{{ t(studio.name) }}</h2>  <!-- NO! -->
<p>{{ t(theme.description) }}</p>  <!-- NO! -->

<!-- Using template literals in template -->
<span>{{ `${t('total')}: RM ${price}` }}</span>  <!-- NO! -->

<!-- Forgetting colon for attribute binding -->
<input placeholder="t('enterFullName')" />  <!-- NO! -->
```

### ✅ Correct:
```vue
<!-- Keep dynamic content as-is -->
<h2>{{ studio.name }}</h2>  <!-- YES! -->
<p>{{ theme.description }}</p>  <!-- YES! -->

<!-- Separate translation from dynamic content -->
<span>{{ t('total') }}: RM {{ price }}</span>  <!-- YES! -->

<!-- Use colon for attribute binding -->
<input :placeholder="t('enterFullName')" />  <!-- YES! -->
```

---

## Progress Tracking

Use this checklist to track implementation:

- [ ] `src/pages/studio-not-found.vue`
- [ ] `src/pages/home/index.vue`
- [ ] `src/pages/booking/index.vue`
- [ ] `src/pages/success/index.vue`
- [ ] `src/pages/home/lookup.vue`
- [ ] `src/pages/theme/details.vue`
- [ ] `src/components/Modal.vue`
- [ ] `src/pages/home/not-found.vue`
- [ ] Test with BM language
- [ ] Test with EN language
- [ ] Build successfully
- [ ] No TypeScript errors

---

## Support

If you need to add new translation keys:

1. Add to `src/locales/types.ts` in the `TranslationKey` type
2. Add translations to both `translationsBM` and `translationsEN` in `src/locales/translations.ts`
3. Use the new key with `t('yourNewKey')` in components

---

**Good luck with the implementation! 🚀**
