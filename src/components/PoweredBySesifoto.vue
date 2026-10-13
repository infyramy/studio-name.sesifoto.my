<template>
  <a
    href="https://sesifoto.my"
    target="_blank"
    rel="noopener noreferrer"
    class="mx-auto flex w-fit flex-col items-center gap-2 text-center text-[10px] tracking-[0.15em] opacity-80 transition-opacity hover:opacity-100 print:hidden"
    :style="{ color: 'var(--p-muted, var(--bk-muted))' }"
  >
    <img
      src="/brand/sesifoto.svg"
      alt="Sesifoto"
      class="h-8 w-8 rounded-md object-contain"
    />
    <span>Powered by Sesifoto</span>
  </a>
</template>
