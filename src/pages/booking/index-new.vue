<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Minus, 
  Check,
  CreditCard,
  Info,
  Loader2,
  ArrowRight
} from 'lucide-vue-next';
import type { Theme, Addon } from "@/types";

const router = useRouter();
const studioStore = useStudioStore();

// Steps
const currentStep = ref<number>(1);

// Background Images Setup
const backgroundImages = [
  "https://plus.unsplash.com/premium_photo-1661963643348-e95c6387ee8a?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=2254&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(() => {
  intervalId = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % backgroundImages.length;
  }, 5000); // Change every 5 seconds
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Auto scroll to top on step change
watch(currentStep, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const steps = [
  { id: 1, title: 'Pilih Tema' },
  { id: 2, title: 'Tarikh & Masa' },
  { id: 3, title: 'Pax & Tambahan' },
  { id: 4, title: 'Ringkasan' }
];

// Data Selections
const selectedTheme = ref<Theme | null>(null);
const selectedDate = ref<string | null>(null);
const selectedSlot = ref<any | null>(null);
const paxCount = ref(1);
const selectedAddons = ref<Record<string, number>>({});
const customerInfo = ref({
  name: '',
  phone: '',
  email: '',
  notes: ''
});

const isProcessingPayment = ref(false);
const activeImageIndices = ref<Record<string, number>>({});

const setActiveImage = (themeId: string, index: number) => {
  activeImageIndices.value[themeId] = index;
};

// Mock slots/dates for demo (replace with store actions later)
const dates = computed(() => {
  // Generate next 14 days
  const list: { date: string; day: number; month: string; weekday: string; isSpecial: boolean; priceModifier: number }[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    list.push({
      date: d.toISOString().slice(0, 10),
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
      weekday: d.toLocaleString('default', { weekday: 'short' }),
      isSpecial: i % 7 === 0 || i === 10, // Dummy logic
      priceModifier: i % 7 === 0 ? 1.2 : 1
    });
  }
  return list;
});

// Updated timeSlots with start and end time
const timeSlots = [
  { id: 's1', start: '09:00 AM', end: '09:30 AM', available: true },
  { id: 's2', start: '09:30 AM', end: '10:00 AM', available: false }, // Booked
  { id: 's3', start: '10:00 AM', end: '10:30 AM', available: true },
  { id: 's4', start: '02:00 PM', end: '02:30 PM', available: true },
  { id: 's5', start: '02:30 PM', end: '03:00 PM', available: true },
];

// Helpers
const selectTheme = (theme: Theme) => {
  selectedTheme.value = theme;
  paxCount.value = theme.base_pax; // Reset/Set to base pax
  nextStep();
};

const selectDate = (dateStr: string) => {
  selectedDate.value = dateStr;
  selectedSlot.value = null; // Reset slot
};

const selectSlot = (slot: any) => {
  if (!slot.available) return;
    selectedSlot.value = slot;
};

const updateAddon = (addon: Addon, change: number) => {
  const current = selectedAddons.value[addon.id] || 0;
  let next = current + change;
  
  if (next < 0) next = 0;
  if (addon.max_quantity && next > addon.max_quantity) next = addon.max_quantity;
  
  selectedAddons.value[addon.id] = next;
};

const nextStep = async () => {
  if (currentStep.value < 4) {
    currentStep.value++;
  } else {
    // Handle Payment Simulation
    isProcessingPayment.value = true;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Redirect to success page with mock booking ID
    const mockBookingId = `RY2025-${Math.floor(Math.random() * 10000)}`;
    router.push(`/success/${mockBookingId}`);
  }
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
  else router.back();
};

// Calculations
const extraPaxCost = computed(() => {
  if (!selectedTheme.value) return 0;
  const extra = Math.max(0, paxCount.value - (selectedTheme.value.base_pax || 0));
  return extra * selectedTheme.value.extra_pax_price;
});

const addonsTotal = computed(() => {
  let total = 0;
  for (const [id, qty] of Object.entries(selectedAddons.value)) {
    const addon = studioStore.addons.find(a => a.id === id);
    if (addon && qty > 0) {
      total += addon.price * qty;
    }
  }
  return total;
});

const grandTotal = computed(() => {
  if (!selectedTheme.value) return 0;
  return selectedTheme.value.base_price + extraPaxCost.value + addonsTotal.value;
});

const depositAmount = computed(() => {
  return grandTotal.value * 0.5; // 50% deposit
});

const isSpecialDateSelected = computed(() => {
  if (!selectedDate.value) return false;
  const dateObj = dates.value.find((d: any) => d.date === selectedDate.value);
  return dateObj ? dateObj.isSpecial : false;
});

</script>

<template>
  <div class="min-h-screen relative font-sans text-gray-900 pb-20" style="font-family: 'Bricolage Grotesque', sans-serif;">
    <!-- Rustic Background Images with Crossfade -->
    <div class="fixed inset-0 z-0 bg-black">
      <div 
        v-for="(img, index) in backgroundImages" 
        :key="index"
        class="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out will-change-opacity"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          alt="Rustic Interior Background"
          class="w-full h-full object-cover scale-105 animate-ken-burns"
        />
      </div>
      <!-- Frosted Glass Overlay -->
      <div
        class="absolute inset-0 bg-[#Fcf9f6]/90 backdrop-blur-sm z-10"
      ></div>
    </div>

    <!-- Content Wrapper -->
    <div class="relative z-20">
    <!-- Header -->
      <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between transition-all duration-300">
        <button
          @click="prevStep" 
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          :disabled="isProcessingPayment"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>
        <h1 class="text-lg font-bold font-serif tracking-wide transition-opacity duration-300 text-gray-900">
          {{ steps[currentStep - 1]?.title || 'Booking' }}
        </h1>
        <div class="w-8"></div> <!-- Spacer for centering -->
      </header>


    <!-- Payment Processing Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isProcessingPayment" 
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
      >
        <div class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center space-y-6 max-w-xs w-full mx-4">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <CreditCard class="w-6 h-6 text-gray-900" />
            </div>
          </div>
          <div class="text-center space-y-2">
            <h3 class="text-xl font-bold font-serif">Memproses Bayaran</h3>
            <p class="text-sm text-gray-500">Sila tunggu sebentar...</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Progress Bar -->
    <div class="h-1 bg-gray-200 w-full">
      <div 
        class="h-full bg-gray-900 transition-all duration-300 ease-out"
        :style="{ width: `${(currentStep / 4) * 100}%` }"
      ></div>
    </div>

    <main class="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 pb-32">
      
      <!-- Step 1: Themes -->
      <div v-if="currentStep === 1" class="space-y-6 animate-fade-in md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        <div v-for="theme in studioStore.themes" :key="theme.id" 
          class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all duration-300"
          @click="selectTheme(theme)"
        >
          <div class="aspect-[4/3] bg-gray-100 relative overflow-hidden group">
            <img :src="theme.images[activeImageIndices[theme.id] || 0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            
            <!-- Image Gallery Thumbs -->
            <div class="absolute top-4 right-4 flex gap-2 z-20" @click.stop>
              <button 
                v-for="(img, idx) in theme.images.slice(0, 4)" 
                :key="idx"
                @click="setActiveImage(theme.id, idx)"
                class="w-10 h-10 rounded-lg border-2 overflow-hidden transition-all duration-300 shadow-lg"
                :class="(activeImageIndices[theme.id] || 0) === idx ? 'border-white scale-110 ring-2 ring-black/20' : 'border-white/50 opacity-80 hover:opacity-100 hover:scale-105'"
              >
                <img :src="img" class="w-full h-full object-cover" />
        </button>
              <div v-if="theme.images.length > 4" class="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[10px] text-white font-bold">
                +{{ theme.images.length - 4 }}
              </div>
      </div>

            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col justify-end h-full pointer-events-none">
              
              <h3 class="text-3xl font-bold font-serif tracking-wide mb-2 leading-tight">{{ theme.name }}</h3>
              
              <p class="text-sm font-sans text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                {{ theme.description_short }}
              </p>

              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-3 text-xs font-sans font-medium uppercase tracking-widest text-gray-400">
                    <span class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                        <Clock class="w-3 h-3" /> {{ theme.duration_minutes }}m
                    </span>
                    <span class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                        <Users class="w-3 h-3" /> {{ theme.base_pax }}pax
          </span>
                </div>
                <span class="text-2xl font-bold font-serif text-white">RM{{ theme.base_price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Date & Time -->
      <div v-if="currentStep === 2" class="space-y-10 animate-fade-in">
        <div class="flex flex-col space-y-4">
          <!-- Date Scroller -->
          <div class="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x mask-fade">
            <button 
              v-for="d in dates" 
              :key="d.date"
              @click="selectDate(d.date)"
              :class="[
                'snap-center flex-shrink-0 w-[4.5rem] h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group',
                selectedDate === d.date 
                  ? 'bg-gray-900 text-white shadow-xl scale-105 ring-4 ring-gray-100' 
                  : 'bg-white text-gray-900 border border-gray-100 hover:border-gray-300 hover:text-gray-600'
              ]"
            >
              <span class="text-[10px] uppercase font-sans tracking-widest font-medium mb-1">{{ d.month }}</span>
              <span class="text-2xl font-bold font-serif leading-none">{{ d.day }}</span>
              <span class="text-[10px] font-sans mt-1 opacity-80">{{ d.weekday }}</span>
              
              <!-- Special Indicator -->
              <div v-if="d.isSpecial" :class="['absolute top-2 right-2 w-1.5 h-1.5 rounded-full', selectedDate === d.date ? 'bg-white' : 'bg-amber-400']"></div>
            </button>
          </div>

          <div v-if="isSpecialDateSelected" class="bg-amber-50/80 backdrop-blur-sm border border-amber-100/50 p-4 rounded-2xl flex items-center gap-3 text-amber-900 shadow-sm">
            <div class="bg-amber-100 p-2 rounded-full">
              <Info class="w-4 h-4" />
            </div>
            <div class="text-xs font-sans leading-relaxed">
              <span class="font-bold block uppercase tracking-wider text-[10px] mb-0.5 text-amber-700">Tarikh Istimewa</span>
              Harga mungkin sedikit berbeza pada tarikh ini.
            </div>
          </div>
          </div>

        <!-- Time Slots -->
        <div class="space-y-4 transition-all duration-500" :class="{ 'opacity-50 blur-sm pointer-events-none': !selectedDate }">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold font-serif flex items-center gap-2">
                  <Clock class="w-5 h-5" /> Pilih Masa
              </h3>
              <span v-if="selectedDate" class="text-xs font-sans text-gray-400 uppercase tracking-wider">{{ selectedSlot ? '1 Masa Dipilih' : 'Pilih 1 Slot' }}</span>
            </div>
          <div class="grid grid-cols-2 gap-3">
            <button 
              v-for="slot in timeSlots" 
              :key="slot.id"
              @click="selectSlot(slot)"
              :disabled="!slot.available"
              :class="[
                'py-4 px-3 rounded-2xl text-sm font-sans font-medium text-center border transition-all duration-300 relative overflow-hidden flex items-center justify-center',
                !slot.available 
                  ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed' 
                  : selectedSlot?.id === slot.id 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
              ]"
            >
              <span class="font-bold text-sm">{{ slot.start }} - {{ slot.end }}</span>
              
              <div v-if="selectedSlot?.id === slot.id" class="absolute inset-0 bg-white/10"></div>
            </button>
        </div>
      </div>
    </div>

      <!-- Step 3: Pax & Addons -->
      <div v-if="currentStep === 3" class="space-y-8 animate-fade-in">
        
        <!-- Pax Counter -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold font-serif text-xl">Bilangan Orang</h3>
              <p class="text-sm text-gray-500 font-sans mt-1">
                Termasuk: <span class="font-medium text-gray-900">{{ selectedTheme?.base_pax }} orang</span>
              </p>
            </div>
            <div class="flex items-center gap-6 bg-gray-50 rounded-full p-1.5 border border-gray-200/50">
              <button 
                @click="paxCount > 1 ? paxCount-- : null"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black disabled:opacity-50 transition-all active:scale-90"
                :disabled="paxCount <= 1"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="font-bold font-serif text-xl w-6 text-center">{{ paxCount }}</span>
              <button
                @click="paxCount++"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black transition-all active:scale-90"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="extraPaxCost > 0" class="bg-gray-50 p-4 rounded-xl flex justify-between items-center text-sm font-sans">
            <div class="text-gray-600 flex items-center gap-2">
              <Users class="w-4 h-4" />
              <span>Caj Tambahan ({{ paxCount - (selectedTheme!.base_pax || 0) }} pax)</span>
            </div>
            <span class="font-bold text-gray-900">+ RM{{ extraPaxCost }}</span>
          </div>
        </div>

        <!-- Addons List -->
        <div class="space-y-4">
          <h3 class="font-bold font-serif text-xl px-1">Add-ons</h3>
          <div v-for="addon in studioStore.addons" :key="addon.id" 
            class="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center transition-all hover:shadow-md"
            :class="{ 'border-gray-900 ring-1 ring-gray-900 bg-gray-50/50': selectedAddons[addon.id] }"
          >
            <div>
              <div class="font-bold font-serif text-lg">{{ addon.name }}</div>
              <div class="text-sm text-gray-500 font-sans mt-0.5">RM{{ addon.price }} <span v-if="addon.max_quantity !== 1" class="text-xs opacity-70">/ unit</span></div>
            </div>
            
            <div v-if="addon.max_quantity === 1" class="flex items-center">
               <button 
                @click="updateAddon(addon, (selectedAddons[addon.id] ? -1 : 1))"
                :class="[
                  'w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300',
                  selectedAddons[addon.id] 
                    ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-110' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                ]"
               >
                 <Check v-if="selectedAddons[addon.id]" class="w-5 h-5" />
               </button>
            </div>
            <div v-else class="flex items-center gap-4 bg-gray-50 rounded-full p-1 border border-gray-200/50">
               <button 
                @click="updateAddon(addon, -1)"
                class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-90"
                :disabled="!selectedAddons[addon.id]"
              >
                <Minus class="w-3 h-3" />
              </button>
              <span class="font-serif font-bold w-4 text-center">{{ selectedAddons[addon.id] || 0 }}</span>
              <button 
                @click="updateAddon(addon, 1)"
                class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
                  </div>
                </div>
              </div>

      <!-- Step 4: Summary -->
      <div v-if="currentStep === 4" class="space-y-8 animate-fade-in">
        
        <!-- Booking Summary Card -->
        <div class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div class="bg-gray-900 p-6 text-white flex justify-between items-center">
            <div>
              <h3 class="font-bold font-serif text-xl">Ringkasan Tempahan</h3>
              <p class="text-xs text-gray-400 font-sans mt-1 uppercase tracking-wider">ID: DRAFT</p>
                </div>
            <div class="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <CreditCard class="w-6 h-6" />
                </div>
              </div>

          <div class="p-6 space-y-6">
            <!-- Theme -->
            <div class="flex justify-between items-start pb-6 border-b border-dashed border-gray-200">
              <div>
                <div class="font-bold font-serif text-lg mb-1">{{ selectedTheme?.name }}</div>
                <div class="text-sm text-gray-500 font-sans flex items-center gap-2">
                  <Calendar class="w-3 h-3" /> {{ selectedDate }}
                  <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                  <Clock class="w-3 h-3" /> {{ selectedSlot?.start }}
                </div>
              </div>
              <div class="font-bold font-sans">RM{{ selectedTheme?.base_price }}</div>
                </div>

            <div class="space-y-3 text-sm font-sans">
              <!-- Extra Pax -->
              <div v-if="extraPaxCost > 0" class="flex justify-between">
                <span class="text-gray-600">Pax Tambahan ({{ paxCount - (selectedTheme!.base_pax || 0) }})</span>
                <span class="font-medium">+ RM{{ extraPaxCost }}</span>
              </div>

              <!-- Addons -->
              <div v-for="(qty, id) in selectedAddons" :key="id" class="flex justify-between">
                <template v-if="qty > 0">
                  <span class="text-gray-600">{{ studioStore.addons.find(a => a.id === id)?.name }} (x{{ qty }})</span>
                  <span class="font-medium">+ RM{{ (studioStore.addons.find(a => a.id === id)?.price || 0) * qty }}</span>
                </template>
              </div>
                </div>

            <!-- Totals -->
            <div class="bg-gray-50 rounded-xl p-4 space-y-3">
              <div class="flex justify-between items-end">
                <span class="text-sm text-gray-500 font-medium uppercase tracking-wider">Jumlah Keseluruhan</span>
                <span class="text-2xl font-bold font-serif">RM{{ grandTotal }}</span>
                </div>
              <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                <span class="text-sm font-bold text-gray-900">Bayar Deposit (50%)</span>
                <span class="font-bold font-sans text-lg text-gray-900">RM{{ depositAmount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Form -->
        <div class="space-y-6 px-2">
          <h3 class="font-bold font-serif text-xl">Maklumat Pelanggan</h3>
          <div class="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div class="relative group">
              <input 
                type="text" 
                v-model="customerInfo.name" 
                id="name"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                placeholder="Nama Anda" 
              />
              <label for="name" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                Nama Penuh
              </label>
            </div>
            
            <div class="relative group">
              <input 
                type="tel" 
                v-model="customerInfo.phone" 
                id="phone"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                placeholder="0123456789" 
              />
              <label for="phone" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                Nombor Telefon
              </label>
            </div>

            <div class="relative group">
              <input 
                type="email" 
                v-model="customerInfo.email" 
                id="email"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                placeholder="email@example.com" 
              />
              <label for="email" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                Emel (Pilihan)
              </label>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 pb-2 z-50 pointer-events-none">
        <div class="max-w-4xl mx-auto px-4 pb-6 safe-area-bottom">
            <div class="bg-white/80 backdrop-blur-md border border-white/40 p-4 rounded-3xl shadow-2xl shadow-black/5 flex items-center justify-between gap-4 pointer-events-auto">
                <div class="flex flex-col pl-2">
                <span class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Jumlah Anggaran</span>
                <span class="font-bold font-serif text-2xl text-gray-900">RM{{ grandTotal }}</span>
                </div>
                <button 
                @click="nextStep" 
                :disabled="
                    (currentStep === 1 && !selectedTheme) || 
                    (currentStep === 2 && !selectedSlot) ||
                    isProcessingPayment
                "
                class="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                <span v-if="isProcessingPayment">Memproses...</span>
                <span v-else-if="currentStep === 4">Bayar Sekarang</span>
                <span v-else>Seterusnya</span>
                <ArrowRight v-if="!isProcessingPayment" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
                </button>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<style scoped>
/* Updated Fonts: Playfair Display & Bricolage Grotesque */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}

.font-sans {
  font-family: 'Bricolage Grotesque', sans-serif;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

@keyframes ken-burns {
  0% { transform: scale(1.05); }
  100% { transform: scale(1.15); }
}

.animate-ken-burns {
  animation: ken-burns 20s linear infinite alternate;
}
</style>
