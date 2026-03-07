import { ref, onMounted, onUnmounted } from 'vue'

export type NormalizedHealth = {
  cpuUsage: number
  ramUsed: number
  ramTotal: number
  diskUsed: number
  diskTotal: number
  containersRunning: number
  containersPaused: number
  containersStopped: number
  containersTotal: number
  uptime: string
  cpuTemp?: number
  localIP?: string
  publicIP?: string
  cloudflareTunnel?: boolean
  recentLogs?: string[]
}

const defaultHealth: NormalizedHealth = {
  cpuUsage: 0,
  ramUsed: 0,
  ramTotal: 0,
  diskUsed: 0,
  diskTotal: 0,
  containersRunning: 0,
  containersPaused: 0,
  containersStopped: 0,
  containersTotal: 0,
  uptime: '—',
  cpuTemp: undefined,
  localIP: undefined,
  publicIP: undefined,
  cloudflareTunnel: false,
  recentLogs: [],
}

function mapApiToNormalized(api: any): NormalizedHealth {
  if (!api) return { ...defaultHealth }

  // memory mapping (try both shapes)
  let ramUsed = 0
  let ramTotal = 0
  if (api.memory) {
    if (typeof api.memory.total === 'object') {
      // structure like provided in the example
      const totalMb = parseFloat(String(api.memory.total.InMb || api.memory.total.InMb)) || 0
      const freeMb = parseFloat(String(api.memory.free?.InMb || api.memory.free)) || 0
      ramTotal = Math.round(totalMb)
      ramUsed = Math.round(Math.max(0, ramTotal - freeMb))
    } else if (typeof api.memory.total === 'number') {
      ramTotal = api.memory.total
      ramUsed = api.memory.used || 0
    }
  } else {
    // fallback to older shape
    ramUsed = api.ramUsed || api.memoryUsed || 0
    ramTotal = api.ramTotal || api.memoryTotal || 0
  }

  const cpuUsage = typeof api.cpu === 'object' && api.cpu.usage ? Number(api.cpu.usage) : api.cpuUsage || api.cpu || 0

  const diskUsed = api.diskUsed || api.disk?.used || api.diskUsedGB || 0
  const diskTotal = api.diskTotal || api.disk?.total || api.diskTotalGB || 0

  const containersRunning = api.containersRunning ?? api.running ?? 0
  const containersPaused = api.containersPaused ?? api.paused ?? 0
  const containersStopped = api.containersStopped ?? api.stopped ?? 0
  const containersTotal = api.containersTotal ?? api.totalContainers ?? (containersRunning + containersPaused + containersStopped)

  const uptime = (api.uptime && (api.uptime.computer?.humanReadable || api.uptime)) || api.uptime || api.systemUptime || '—'

  const cpuTemp = api.cpuTemp ?? api.temperature ?? (api.cpu?.temp ?? undefined)
  const localIP = api.localIP ?? api.network?.localIP ?? api.ipLocal
  const publicIP = api.publicIP ?? api.network?.publicIP ?? api.ipPublic
  const cloudflareTunnel = api.cloudflareTunnel ?? api.tunnel?.cloudflare ?? false
  const recentLogs = api.recentLogs ?? api.logs ?? []

  return {
    cpuUsage: Number(cpuUsage) || 0,
    ramUsed: Number(ramUsed) || 0,
    ramTotal: Number(ramTotal) || 0,
    diskUsed: Number(diskUsed) || 0,
    diskTotal: Number(diskTotal) || 0,
    containersRunning: Number(containersRunning) || 0,
    containersPaused: Number(containersPaused) || 0,
    containersStopped: Number(containersStopped) || 0,
    containersTotal: Number(containersTotal) || 0,
    uptime: String(uptime),
    cpuTemp: cpuTemp === undefined ? undefined : Number(cpuTemp),
    localIP: localIP ? String(localIP) : undefined,
    publicIP: publicIP ? String(publicIP) : undefined,
    cloudflareTunnel: Boolean(cloudflareTunnel),
    recentLogs: Array.isArray(recentLogs) ? recentLogs.map(String) : [],
  }
}

export function useHealth(pollMs = 3000) {
  const health = ref<NormalizedHealth>({ ...defaultHealth })
  let intervalId: number | undefined
  let abort = false

  async function fetchOnce() {
    try {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      health.value = mapApiToNormalized(data)
    } catch (err) {
      // keep previous values; optionally set an error flag in the future
      // console.warn('useHealth fetch error', err)
    }
  }

  onMounted(() => {
    // initial load
    fetchOnce()
    intervalId = window.setInterval(() => {
      if (abort) return
      fetchOnce()
    }, pollMs)
  })

  onUnmounted(() => {
    abort = true
    if (intervalId) clearInterval(intervalId)
  })

  return { health }
}

export default useHealth
