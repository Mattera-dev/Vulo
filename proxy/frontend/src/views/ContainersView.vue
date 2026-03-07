<template>
  <div class="p-8 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Containers</h1>
      <span class="text-sm text-muted-foreground"
        >{{ containers.length }} containers encontrados</span
      >
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="container in containers"
        :key="container.Id"
        class="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-4"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold text-foreground truncate">{{ container.Names[0] }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">{{ container.Image }}</div>
          </div>
          <span
            class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
            :class="statusClass(container.Status)"
          >
            {{ statusLabel(container.Status) }}
          </span>
        </div>

        <!-- Info rows -->
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Linguagem</span>
            <span class="font-medium">{{ container.Names[0] }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Porta</span>
            <span class="font-mono font-medium">:{{ container.Ports[0]?.PublicPort }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Disco</span>
            <span class="font-medium">{{ container.Image }} GB</span>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-muted-foreground">RAM</span>
              <span class="font-medium">{{ container.Names[0] }} / {{ container.Names[0] }} MB</span>
            </div>
            <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="ramBarClass(0, 0)"
                :style="{
                  width: ((1 / 1) * 100).toFixed(0) + '%',
                }"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            @click="openDetails(container)"
            class="flex-1 text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
          >
            Mais detalhes
          </button>
          <button
            class="text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            :title="container.Status === 'paused' ? 'Despausar' : 'Pausar'"
          >
            <component :is="container.Status === 'paused' ? Play : Pause" class="w-3.5 h-3.5" />
          </button>
          <button
            @click="initiateDelete(container)"
            class="text-xs font-medium border border-red-200 text-red-600 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
            title="Deletar"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog: Mais Detalhes -->
    <Teleport to="body">
      <div
        v-if="selectedContainer"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="selectedContainer = null"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative z-10 bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
          <div class="flex items-start justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold">{{ selectedContainer.Names[0] }}</h2>
              <p class="text-sm text-muted-foreground">{{ selectedContainer.Image }}</p>
            </div>
            <button
              @click="selectedContainer = null"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Portas bindadas</span>
              <span class="font-mono font-medium">{{
                selectedContainer.Ports[0]?.PublicPort ? ':' + selectedContainer.Ports[0].PublicPort : 'Nenhuma'
              }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Caminho de upload</span>
              <span class="font-mono text-xs">{{ selectedContainer.Names[0] }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Data de upload</span>
              <span class="font-medium">{{ formatDate("selectedContainer.Names[0]") }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Linguagem</span>
              <span class="font-medium">{{ selectedContainer.Names[0] }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">RAM utilizada</span>
              <span class="font-medium"
                >{{ selectedContainer.Names[0] }} / {{ selectedContainer.Names[0] }} MB</span
              >
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Tamanho em disco</span>
              <span class="font-medium">{{ selectedContainer.Names[0] }} GB</span>
            </div>
          </div>
          <div class="mt-5 flex justify-end">
            <button
              @click="selectedContainer = null"
              class="bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: Confirmar Delete -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
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
              <h2 class="font-bold text-foreground">Deletar container?</h2>
              <p class="text-sm text-muted-foreground">{{ deleteTarget.Names[0] }}</p>
            </div>
          </div>
          <p v-if="!deleteConfirmStep" class="text-sm text-muted-foreground mb-5">
            Esta ação irá remover o container permanentemente. Tem certeza?
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
import { onMounted, ref } from 'vue'
import { Pause, Play, Trash2, X, AlertTriangle } from 'lucide-vue-next'
import { useContainersStore } from '@/stores/containers'
import type { Container } from '@/types/containers'

const containersStore = useContainersStore()
const containers = ref(containersStore.containers)
const selectedContainer = ref<Container | null>(null)
const deleteTarget = ref<Container | null>(null)
const deleteConfirmStep = ref(false)

onMounted( ( ) => {
    containersStore.fetchContainers()
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

function ramBarClass(used: number, limit: number) {
  const pct = (used / limit) * 100
  if (pct > 80) return 'bg-red-500'
  if (pct > 60) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function openDetails(container: Container) {
  selectedContainer.value = container
}

function initiateDelete(container: Container) {
  deleteTarget.value = container
  deleteConfirmStep.value = false
}

function cancelDelete() {
  deleteTarget.value = null
  deleteConfirmStep.value = false
}

function confirmDelete() {
  if (!deleteTarget.value) return
  containersStore.setContainers(containers.value.filter((c) => c.Id !== deleteTarget.value!.Id))
  cancelDelete()
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
</script>
