<template>
  <Transition name="portal-theme-icon" mode="out-in">
    <Sun v-if="isDark" key="sun" :class="iconClass" />
    <Moon v-else key="moon" :class="iconClass" />
  </Transition>
</template>

<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";

withDefaults(defineProps<{ isDark: boolean; iconClass?: string }>(), {
  iconClass: "h-4 w-4",
});
</script>
