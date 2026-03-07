<template>
  <div class="p-8 h-full max-w-6xl mx-auto">
    <div class="flex gap-8">
      <!-- Left: Project / Welcome (like Jenkins sidebar) -->
      <aside class="w-64 max-h-96 shrink-0 rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
        <div class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <Server class="w-10 h-10 text-white" />
        </div>
        <h2 class="text-lg font-bold">Bem-vindo ao</h2>
        <div class="text-2xl font-extrabold mt-1">Vulo</div>
        <div class="text-xs text-muted-foreground mt-2">Dashboard</div>

        <p class="text-sm text-muted-foreground mt-4">Gerencie containers, apps e configurações do sistema.</p>

      </aside>

      <!-- Right: Navigation / Actions like Jenkins main area -->
      <section class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold">Visão geral</h1>
          <div class="text-sm text-muted-foreground">{{ health.uptime }}</div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-2 mb-4">
          <button
            :class="['px-3 py-1 rounded-md text-sm font-medium', activeTab === 'sistema' ? 'bg-slate-800 text-white' : 'text-muted-foreground border border-transparent hover:bg-muted/20']"
            @click="activeTab = 'sistema'"
          >
            Sistema
          </button>
          <button
            :class="['px-3 py-1 rounded-md text-sm font-medium', activeTab === 'containers' ? 'bg-slate-800 text-white' : 'text-muted-foreground border border-transparent hover:bg-muted/20']"
            @click="activeTab = 'containers'"
          >
            Containers
          </button>
          <button
            :class="['px-3 py-1 rounded-md text-sm font-medium', activeTab === 'diario' ? 'bg-slate-800 text-white' : 'text-muted-foreground border border-transparent hover:bg-muted/20']"
            @click="activeTab = 'diario'"
          >
            Diário
          </button>
        </div>

        <!-- Tab content: Sistema -->
        <div v-if="activeTab === 'sistema'" class="space-y-4">
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-semibold">CPU (uso global)</div>
              <div class="text-xs text-muted-foreground">{{ health.cpuUsage }}%</div>
            </div>
            <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500" :style="{ width: health.cpuUsage + '%' }" />
            </div>
            <div class="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-muted-foreground">Memória</div>
                <div class="font-medium">{{ formatRam(health.ramUsed) }} / {{ formatRam(health.ramTotal) }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Disco</div>
                <div class="font-medium">{{ health.diskUsed }} GB / {{ health.diskTotal }} GB</div>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-4">
              <div>
                <div class="text-xs text-muted-foreground">Temp. CPU</div>
                <div class="font-medium">{{ health.cpuTemp ?? '—' }} °C</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">IP Local</div>
                <div class="font-mono text-sm">{{ health.localIP ?? '—' }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">IP Público</div>
                <div class="font-mono text-sm">{{ health.publicIP ?? '—' }}</div>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <div class="flex items-center gap-2">
                <div :class="health.cloudflareTunnel ? 'w-3 h-3 rounded-full bg-emerald-500' : 'w-3 h-3 rounded-full bg-red-500'" />
                <div class="text-sm">Túnel Cloudflare</div>
              </div>
            </div>
          </div>

          <!-- quick stat row -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="rounded-xl border bg-card p-4">
              <div class="text-xs text-muted-foreground">Total de containers</div>
              <div class="text-2xl font-bold">{{ health.containersTotal }}</div>
              <div class="text-xs text-muted-foreground">{{ health.containersRunning }} rodando • {{ health.containersPaused }} pausados • {{ health.containersStopped }} parados</div>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <div class="text-xs text-muted-foreground">Uptime</div>
              <div class="text-2xl font-bold">{{ health.uptime }}</div>
              <div class="text-xs text-muted-foreground">Tempo desde o último reboot</div>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <div class="text-xs text-muted-foreground">Status do disco</div>
              <div class="text-2xl font-bold">{{ ((health.diskUsed / Math.max(1, health.diskTotal)) * 100).toFixed(0) }}%</div>
              <div class="text-xs text-muted-foreground">Uso atual</div>
            </div>
          </div>
        </div>

        <!-- Tab content: Containers (mini-graphs) -->
        <div v-if="activeTab === 'containers'" class="space-y-4">
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <div class="text-sm font-semibold mb-3">Containers (visão rápida)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="c in containers" :key="c.id" class="p-3 rounded-md border bg-background">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <div class="font-medium">{{ c.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ c.image }} • {{ c.language }}</div>
                  </div>
                  <div class="text-xs text-muted-foreground">{{ c.port }}</div>
                </div>
                <div class="text-xs text-muted-foreground mb-2">CPU (últimos momentos)</div>
                <div class="flex items-end gap-1 h-8">
                  <div v-for="(val, i) in c.cpuHistory" :key="i" :title="val + '%'" :style="{ height: (val / 100 * 100) + '%' }" class="w-1.5 bg-slate-700 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab content: Diário / Logs -->
        <div v-if="activeTab === 'diario'" class="space-y-4">
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <div class="text-sm font-semibold mb-3">Últimos eventos</div>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li v-for="(l, i) in health.recentLogs" :key="i">{{ l }}</li>
            </ul>
          </div>
        </div>

        <!-- Bottom quick actions -->
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="group rounded-xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-all hover:border-slate-400"
          >
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="action.iconBg">
              <component :is="action.icon" class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-semibold text-foreground">{{ action.label }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ action.description }}</div>
            </div>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Box, LayoutGrid, Settings, Activity, Server } from 'lucide-vue-next'
import useHealth from '@/composables/useHealth'

import { computed } from 'vue'

const { health } = useHealth(3000)

const stats = computed(() => [
  {
    label: 'Containers ativos',
    value: health.value.containersRunning,
    sub: `${health.value.containersTotal} total`,
    icon: Server,
  },
  {
    label: 'RAM utilizada',
    value: `${health.value.ramUsed} MB`,
    sub: `de ${health.value.ramTotal} MB`,
    icon: Activity,
  },
  {
    label: 'CPU',
    value: `${health.value.cpuUsage}%`,
    sub: 'uso atual do processador',
    icon: Activity,
  },
])

const quickActions = [
  {
    to: '/configuracoes',
    label: 'Configurações',
    description: 'Ajuste as configurações gerais do sistema e monitore a saúde',
    icon: Settings,
    iconBg: 'bg-slate-600',
  },
  {
    to: '/containers',
    label: 'Containers',
    description: 'Visualize, pause, delete e gerencie seus containers Docker',
    icon: Box,
    iconBg: 'bg-blue-600',
  },
  {
    to: '/apps',
    label: 'Apps',
    description: 'Acesse os dados e logs dos seus projetos em execução',
    icon: LayoutGrid,
    iconBg: 'bg-emerald-600',
  },
]
import { ref } from 'vue'
import { mockContainers } from '@/data/mock'

const containers = mockContainers
const activeTab = ref<'sistema' | 'containers' | 'diario'>('sistema')

function formatRam(mb: number) {
  const gb = mb / 1024
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${mb} MB`
}

// expose mockSystemHealth to template (already imported) - no extra transformations needed
</script>
