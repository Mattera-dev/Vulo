<template>
  <div class="p-8 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Apps</h1>
      <span class="text-sm text-muted-foreground">{{ apps.length }} apps encontrados</span>
    </div>

    <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th class="text-left px-5 py-3 font-medium text-muted-foreground">Projeto</th>
            <th class="text-left px-5 py-3 font-medium text-muted-foreground">Linguagem</th>
            <th class="text-left px-5 py-3 font-medium text-muted-foreground">
              RAM (usada / definida)
            </th>
            <th class="text-left px-5 py-3 font-medium text-muted-foreground">CPU</th>
            <th class="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
            <th class="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="app in apps"
            :key="app.id"
            class="border-b last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-5 py-4 font-medium text-foreground">{{ app.name }}</td>
            <td class="px-5 py-4 text-muted-foreground">{{ app.language }}</td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-2">
                <div class="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    :class="ramBarClass(app.ramUsed, app.ramDefined)"
                    :style="{ width: ((app.ramUsed / app.ramDefined) * 100).toFixed(0) + '%' }"
                  />
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap">
                  {{ app.ramUsed }} / {{ app.ramDefined }} MB
                </span>
              </div>
            </td>
            <td class="px-5 py-4">
              <span
                class="text-xs font-semibold"
                :class="
                  app.cpuUsage > 70
                    ? 'text-red-500'
                    : app.cpuUsage > 40
                      ? 'text-yellow-600'
                      : 'text-emerald-600'
                "
              >
                {{ app.cpuUsage }}%
              </span>
            </td>
            <td class="px-5 py-4">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="statusClass(app.status)"
              >
                {{ statusLabel(app.status) }}
              </span>
            </td>
            <td class="px-5 py-4 text-right">
              <RouterLink
                :to="`/apps/${app.name}`"
                class="text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-accent transition-colors inline-flex items-center gap-1"
              >
                Ver detalhes
                <ArrowRight class="w-3 h-3" />
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { mockApps, type App } from '@/data/mock'

const apps = ref<App[]>([...mockApps])

function statusClass(status: string) {
  if (status === 'running')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (status === 'paused')
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
}

function statusLabel(status: string) {
  if (status === 'running') return 'Rodando'
  if (status === 'paused') return 'Pausado'
  return 'Parado'
}

function ramBarClass(used: number, defined: number) {
  const pct = (used / defined) * 100
  if (pct > 80) return 'bg-red-500'
  if (pct > 60) return 'bg-yellow-500'
  return 'bg-emerald-500'
}
</script>
