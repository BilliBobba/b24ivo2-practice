import { Suspense } from "react"

// Компонент для отображения информации о контейнере
async function ContainerInfo() {
  const hostname = process.env.HOSTNAME || "unknown"
  const canary = process.env.CANARY === "true"

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl w-full">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">DevOps Practice v3</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Container ID:</span>
          <code className="text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded">{hostname.substring(0, 12)}</code>
        </div>

        {canary && (
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border-2 border-yellow-400">
            <span className="font-semibold text-yellow-800 dark:text-yellow-300">🐤 Canary Deployment</span>
            <span className="text-sm text-yellow-600 dark:text-yellow-400">This is a canary instance</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <a
            href="/api/health"
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center"
          >
            <div className="font-semibold text-green-800 dark:text-green-300">Health Check</div>
            <div className="text-sm text-green-600 dark:text-green-400">/api/health</div>
          </a>

          <a
            href="/api/metrics"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center"
          >
            <div className="font-semibold text-blue-800 dark:text-blue-300">Metrics</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">/api/metrics</div>
          </a>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Load balanced by Traefik • Monitored by Prometheus • Logged by Loki</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        }
      >
        <ContainerInfo />
      </Suspense>
    </main>
  )
}
