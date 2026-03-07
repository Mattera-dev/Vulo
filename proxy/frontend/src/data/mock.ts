export interface Container {
  id: string
  name: string
  image: string
  language: string
  ramUsed: number
  ramLimit: number
  diskSize: number
  port: number
  status: 'running' | 'paused' | 'stopped'
  bindedPorts: string[]
  uploadPath: string
  uploadDate: string
}

export interface App {
  id: string
  name: string
  language: string
  ramUsed: number
  ramDefined: number
  cpuUsage: number
  status: 'running' | 'paused' | 'stopped'
  port: number
  image: string
  diskSize: number
  bindedPorts: string[]
  uploadPath: string
  uploadDate: string
  logs: string[]
}

export const mockContainers: Container[] = [
  {
    id: '1',
    name: 'api-gateway',
    image: 'node:20-alpine',
    language: 'Node.js',
    ramUsed: 256,
    ramLimit: 512,
    diskSize: 1.2,
    port: 3000,
    status: 'running',
    bindedPorts: ['3000:3000', '3001:3001'],
    uploadPath: '/home/deploy/api-gateway',
    uploadDate: '2026-02-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'auth-service',
    image: 'python:3.12-slim',
    language: 'Python',
    ramUsed: 128,
    ramLimit: 256,
    diskSize: 0.8,
    port: 8000,
    status: 'running',
    bindedPorts: ['8000:8000'],
    uploadPath: '/home/deploy/auth-service',
    uploadDate: '2026-02-20T14:00:00Z',
  },
  {
    id: '3',
    name: 'frontend-app',
    image: 'nginx:alpine',
    language: 'Nginx',
    ramUsed: 32,
    ramLimit: 128,
    diskSize: 0.4,
    port: 80,
    status: 'running',
    bindedPorts: ['80:80', '443:443'],
    uploadPath: '/home/deploy/frontend-app',
    uploadDate: '2026-03-01T09:00:00Z',
  },
  {
    id: '4',
    name: 'worker-queue',
    image: 'golang:1.22-alpine',
    language: 'Go',
    ramUsed: 64,
    ramLimit: 256,
    diskSize: 0.6,
    port: 9000,
    status: 'paused',
    bindedPorts: ['9000:9000'],
    uploadPath: '/home/deploy/worker-queue',
    uploadDate: '2026-02-28T16:45:00Z',
  },
  {
    id: '5',
    name: 'database-proxy',
    image: 'postgres:16-alpine',
    language: 'PostgreSQL',
    ramUsed: 512,
    ramLimit: 1024,
    diskSize: 4.5,
    port: 5432,
    status: 'running',
    bindedPorts: ['5432:5432'],
    uploadPath: '/home/deploy/database-proxy',
    uploadDate: '2026-01-10T08:00:00Z',
  },
  {
    id: '6',
    name: 'cache-layer',
    image: 'redis:7-alpine',
    language: 'Redis',
    ramUsed: 96,
    ramLimit: 512,
    diskSize: 0.2,
    port: 6379,
    status: 'stopped',
    bindedPorts: ['6379:6379'],
    uploadPath: '/home/deploy/cache-layer',
    uploadDate: '2026-01-25T11:00:00Z',
  },
]

export const mockApps: App[] = mockContainers.map((c) => ({
  ...c,
  logs: [
    `[${new Date().toISOString()}] INFO  Container ${c.name} started`,
    `[${new Date(Date.now() - 60000).toISOString()}] INFO  Listening on port ${c.port}`,
    `[${new Date(Date.now() - 120000).toISOString()}] INFO  Health check passed`,
    `[${new Date(Date.now() - 180000).toISOString()}] WARN  High memory usage detected`,
    `[${new Date(Date.now() - 240000).toISOString()}] INFO  Request received GET /health`,
    `[${new Date(Date.now() - 300000).toISOString()}] INFO  Request received POST /api/data`,
    `[${new Date(Date.now() - 360000).toISOString()}] ERROR Timeout connecting to upstream`,
    `[${new Date(Date.now() - 420000).toISOString()}] INFO  Retry attempt 1/3`,
    `[${new Date(Date.now() - 480000).toISOString()}] INFO  Connection restored`,
    `[${new Date(Date.now() - 540000).toISOString()}] INFO  Request received GET /metrics`,
    `[${new Date(Date.now() - 600000).toISOString()}] INFO  Scheduled job ran successfully`,
    `[${new Date(Date.now() - 660000).toISOString()}] DEBUG Processing queue item #4821`,
  ],
}))

export const mockSystemHealth = {
  ramUsed: 3072,
  ramTotal: 8192,
  cpuUsage: 42,
  containersRunning: mockContainers.filter((c) => c.status === 'running').length,
  containersPaused: mockContainers.filter((c) => c.status === 'paused').length,
  containersStopped: mockContainers.filter((c) => c.status === 'stopped').length,
  containersTotal: mockContainers.length,
  uptime: '14 dias, 3 horas',
  diskUsed: 120,
  diskTotal: 500,
}

// Additional mocked fields for dashboard
mockSystemHealth.cpuTemp = 65 // Celsius
mockSystemHealth.localIP = '192.168.1.10'
mockSystemHealth.publicIP = '34.120.45.67'
mockSystemHealth.cloudflareTunnel = true
mockSystemHealth.recentLogs = [
  "Container 'vulo-api' iniciou com sucesso às 14:30",
  "Falha no Build do projeto 'next-app' (Erro de Dependência)",
  "Nginx recarregado com nova configuração",
]

// Add cpuHistory to containers (mock small sparkline data)
mockContainers.forEach((c, idx) => {
  // create a small history (last 8 samples)
  const base = Math.max(5, Math.round((c.ramUsed / c.ramLimit) * 100))
  c['cpuHistory'] = Array.from({ length: 8 }).map((_, i) => {
    // create variation around base and container-specific offset
    const jitter = ((idx + 1) * 3 + i * 2) % 15
    return Math.min(100, Math.max(1, base + (i % 3 === 0 ? jitter : -jitter)))
  })
})
