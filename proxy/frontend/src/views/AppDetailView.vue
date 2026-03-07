<template>
  <div class="p-8 max-w-5xl mx-auto">
    <!-- Back -->
    <RouterLink
      to="/apps"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Voltar para Apps
    </RouterLink>

    <div v-if="app">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-foreground">{{ app.name }}</h1>
          <p class="text-sm text-muted-foreground mt-1">{{ app.image }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium px-3 py-1 rounded-full" :class="statusClass(app.status)">
            {{ statusLabel(app.status) }}
          </span>
          <button
            @click="togglePause"
            class="inline-flex items-center gap-1.5 border text-sm font-medium px-4 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <component :is="app.status === 'paused' ? Play : Pause" class="w-4 h-4" />
            {{ app.status === 'paused' ? 'Despausar' : 'Pausar' }}
          </button>
          <button
            @click="initiateDelete"
            class="inline-flex items-center gap-1.5 border border-red-200 text-red-600 text-sm font-medium px-4 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            Deletar projeto
          </button>
        </div>
      </div>

      <!-- Info cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          v-for="info in infoCards"
          :key="info.label"
          class="rounded-xl border bg-card p-4 shadow-sm"
        >
          <div class="text-xs text-muted-foreground mb-1">{{ info.label }}</div>
          <div class="font-semibold text-foreground text-sm">{{ info.value }}</div>
        </div>
      </div>

      <!-- Details table -->
      <div class="rounded-xl border bg-card p-5 shadow-sm mb-8">
        <h2 class="font-semibold mb-4">Detalhes do projeto</h2>
        <div class="space-y-3 text-sm divide-y">
          <div class="flex justify-between py-2">
            <span class="text-muted-foreground">Portas bindadas</span>
            <span class="font-mono font-medium">{{ app.bindedPorts.join(', ') }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted-foreground">Caminho de upload</span>
            <span class="font-mono text-xs">{{ app.uploadPath }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted-foreground">Data de upload</span>
            <span class="font-medium">{{ formatDate(app.uploadDate) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted-foreground">Tamanho em disco</span>
            <span class="font-medium">{{ app.diskSize }} GB</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-muted-foreground">Porta principal</span>
            <span class="font-mono font-medium">:{{ app.port }}</span>
          </div>
        </div>
      </div>

      <!-- Terminal logs -->
      <div class="rounded-xl border bg-slate-950 text-slate-100 shadow-sm overflow-hidden">
        <div
          class="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800"
        >
          <div class="flex items-center gap-2">
            <Terminal class="w-4 h-4 text-slate-400" />
            <span class="text-sm font-medium text-slate-300">Logs do terminal</span>
          </div>
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500" />
            <div class="w-3 h-3 rounded-full bg-yellow-400" />
            <div class="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div class="p-4 font-mono text-xs leading-relaxed overflow-auto max-h-80 space-y-1">
          <div
            v-for="(log, i) in app.logs"
            :key="i"
            class="whitespace-pre-wrap"
            :class="logClass(log)"
          >
            {{ log }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-muted-foreground">App não encontrado.</div>

    <!-- Dialog: Confirmar Delete -->
    <Teleport to="body">
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="cancelDelete"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative z-10 bg-card rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 class="font-bold text-foreground">Deletar projeto?</h2>
              <p class="text-sm text-muted-foreground">{{ app?.name }}</p>
            </div>
          </div>
          <p v-if="!deleteConfirmStep" class="text-sm text-muted-foreground mb-5">
            Esta ação irá remover o projeto permanentemente. Tem certeza?
          </p>
          <p v-else class="text-sm text-red-600 font-medium mb-5">
            ⚠️ Confirmação final: esta ação não pode ser desfeita!
          </p>
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
              class="flex-1 border text-sm font-medium px-4 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              v-if="!deleteConfirmStep"
              @click="deleteConfirmStep = true"
              class="flex-1 bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Deletar
            </button>
            <button
              v-else
              @click="confirmDelete"
              class="flex-1 bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-800 transition-colors"
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Pause, Play, Trash2, Terminal, AlertTriangle } from 'lucide-vue-next'
import { mockApps } from '@/data/mock'

const route = useRoute()
const router = useRouter()

const appName = route.params.name as string
const app = ref(
  mockApps.find((a) => a.name === appName)
    ? { ...mockApps.find((a) => a.name === appName)! }
    : null,
)

const showDeleteDialog = ref(false)
const deleteConfirmStep = ref(false)

const infoCards = computed(() => {
  if (!app.value) return []
  return [
    { label: 'Linguagem', value: app.value.language },
    { label: 'RAM usada', value: `${app.value.ramUsed} MB` },
    { label: 'RAM definida', value: `${app.value.ramDefined} MB` },
    { label: 'CPU', value: `${app.value.cpuUsage}%` },
  ]
})

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

function togglePause() {
  if (!app.value) return
  app.value.status = app.value.status === 'paused' ? 'running' : 'paused'
}

function initiateDelete() {
  showDeleteDialog.value = true
  deleteConfirmStep.value = false
}

function cancelDelete() {
  showDeleteDialog.value = false
  deleteConfirmStep.value = false
}

function confirmDelete() {
  cancelDelete()
  router.push('/apps')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function logClass(log: string) {
  if (log.includes('ERROR')) return 'text-red-400'
  if (log.includes('WARN')) return 'text-yellow-400'
  if (log.includes('DEBUG')) return 'text-slate-500'
  return 'text-slate-300'
}
</script>
