<template>
  <nav class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
    <RouterLink to="/" class="flex items-end gap-2">
      <span class="text-xl font-bold tracking-wider text-white">Vulo</span>
      <span class="text-xs text-slate-400 font-light">dashboard</span>
    </RouterLink>
    <ul class="flex items-center gap-1">
      <li v-for="link in navLinks" :key="link.to">
        <RouterLink
          :to="link.to"
          class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-700 text-slate-300 hover:text-white"
          active-class="bg-slate-700 text-white"
        >
          <component :is="link.icon" class="w-4 h-4" />
          {{ link.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { Settings, Box, LayoutGrid } from 'lucide-vue-next'
const navLinks = [
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/containers', label: 'Containers', icon: Box },
  { to: '/apps', label: 'Apps', icon: LayoutGrid },
]
</script>
