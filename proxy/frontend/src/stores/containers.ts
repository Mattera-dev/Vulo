import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Container } from '@/types/containers'



export const useContainersStore = defineStore('containers', () => {

  const containers = ref<Container[]>([])

  const setContainers = (newContainers: Container[]) => {
    containers.value = newContainers
  }

  const runningContainers = computed(() => containers.value.filter(c => c.State === 'running'))
  const pausedContainers = computed(() => containers.value.filter(c => c.State === 'paused'))
  const stoppedContainers = computed(() => containers.value.filter(c => c.State === 'exited' || c.State === 'dead'))

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/containers')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setContainers(data.containers || [])
    } catch (err) {
      // keep previous values; optionally set an error flag in the future
      // console.warn('fetchContainers error', err)
    }
  }

  return {
    containers,
    setContainers,
    fetchContainers,
    runningContainers,
    pausedContainers,
    stoppedContainers,
  }

})
