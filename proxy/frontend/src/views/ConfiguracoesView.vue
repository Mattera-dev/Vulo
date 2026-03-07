<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Configurações</h1>

    <!-- Tabs -->
    <div class="border-b mb-6 flex gap-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="
          activeTab === tab.id
            ? 'border-slate-800 text-slate-900 dark:border-slate-200 dark:text-white'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Configurações Gerais -->
    <div v-if="activeTab === 'general'">
      <div class="rounded-xl border bg-card p-6 shadow-sm space-y-5 max-w-xl">
        <div class="space-y-1">
          <label class="text-sm font-medium">Nome do servidor</label>
          <input
            v-model="settings.serverName"
            type="text"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Domínio principal</label>
          <input
            v-model="settings.domain"
            type="text"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">E-mail de notificações</label>
          <input
            v-model="settings.email"
            type="email"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Timeout de containers (segundos)</label>
          <input
            v-model="settings.timeout"
            type="number"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            id="autoRestart"
            v-model="settings.autoRestart"
            type="checkbox"
            class="h-4 w-4 rounded border accent-slate-800"
          />
          <label for="autoRestart" class="text-sm font-medium"
            >Reiniciar containers automaticamente</label
          >
        </div>
        <div class="pt-2">
          <button
            @click="saveSettings"
            class="bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-700 transition-colors"
            :class="saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''"
          >
            {{ saved ? '✓ Salvo!' : 'Salvar configurações' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: Saúde -->
    <div v-if="activeTab === 'health'" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- RAM -->
        <div class="rounded-xl border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-foreground">Memória RAM</span>
            <span class="text-xs text-muted-foreground">
              {{ health.ramUsed }} MB / {{ health.ramTotal }} MB
            </span>
          </div>
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="
                ramPercent > 80
                  ? 'bg-red-500'
                  : ramPercent > 60
                    ? 'bg-yellow-500'
                    : 'bg-emerald-500'
              "
              :style="{ width: ramPercent + '%' }"
            />
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            {{ ramPercent.toFixed(1) }}% utilizado
          </div>
        </div>

        <!-- CPU -->
        <div class="rounded-xl border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-foreground">Processador (CPU)</span>
            <span class="text-xs text-muted-foreground">{{ health.cpuUsage }}%</span>
          </div>
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="
                health.cpuUsage > 80
                  ? 'bg-red-500'
                  : health.cpuUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              "
              :style="{ width: health.cpuUsage + '%' }"
            />
          </div>
          <div class="mt-2 text-xs text-muted-foreground">{{ health.cpuUsage }}% em uso</div>
        </div>

        <!-- Disco -->
        <div class="rounded-xl border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-foreground">Disco</span>
            <span class="text-xs text-muted-foreground">
              {{ health.diskUsed }} GB / {{ health.diskTotal }} GB
            </span>
          </div>
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              class="h-full rounded-full bg-purple-500 transition-all"
              :style="{ width: diskPercent + '%' }"
            />
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            {{ diskPercent.toFixed(1) }}% utilizado
          </div>
        </div>

        <!-- Containers -->
        <div class="rounded-xl border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-foreground">Containers</span>
            <span class="text-xs text-muted-foreground">{{ health.containersTotal }} total</span>
          </div>
          <div class="flex gap-3">
            <div class="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
              <div class="text-2xl font-bold text-emerald-600">{{ health.containersRunning }}</div>
              <div class="text-xs text-muted-foreground mt-1">Rodando</div>
            </div>
            <div class="flex-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ health.containersPaused }}</div>
              <div class="text-xs text-muted-foreground mt-1">Pausados</div>
            </div>
            <div class="flex-1 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <div class="text-2xl font-bold text-red-500">{{ health.containersStopped }}</div>
              <div class="text-xs text-muted-foreground mt-1">Parados</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Uptime -->
      <div class="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
        <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <div>
          <div class="text-sm font-semibold">Sistema online</div>
          <div class="text-xs text-muted-foreground">Uptime: {{ health.uptime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import useHealth from '@/composables/useHealth'

const tabs = [
  { id: 'general', label: 'Configurações Gerais' },
  { id: 'health', label: 'Saúde' },
]

const activeTab = ref('general')
const saved = ref(false)

const { health } = useHealth(3000)

const ramPercent = computed(() => (health.value.ramTotal ? (health.value.ramUsed / health.value.ramTotal) * 100 : 0))
const diskPercent = computed(() => (health.value.diskTotal ? (health.value.diskUsed / health.value.diskTotal) * 100 : 0))

const settings = ref({
  serverName: 'vulo-prod-01',
  domain: 'app.vulo.io',
  email: 'admin@vulo.io',
  timeout: 30,
  autoRestart: true,
})

function saveSettings() {
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2000)
}
</script>
