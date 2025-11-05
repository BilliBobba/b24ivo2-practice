import http from "k6/http"
import { check, sleep } from "k6"
import { Counter, Trend, Rate } from "k6/metrics"
const __ENV = {} // Simulating __ENV as a global variable for the sake of this example

// Кастомные метрики
const errorRate = new Rate("errors")
const latency = new Trend("latency")
const canaryRequests = new Counter("canary_requests")

// Настройки теста и SLO
export const options = {
  // SLO: p95 latency ≤ 200ms, error rate ≤ 0.1%
  thresholds: {
    http_req_failed: ["rate<=0.001"], // ≤ 0.1% ошибок
    http_req_duration: ["p(95)<=200"], // p95 ≤ 200ms
    errors: ["rate<=0.001"],
  },

  // Профиль нагрузки: ramp-up/ramp-down (упрощенный для быстрого теста)
  stages: [
    { duration: "30s", target: 10 }, // Разогрев: 0 → 10 пользователей
    { duration: "1m", target: 30 }, // Рост: 10 → 30 пользователей
    { duration: "2m", target: 50 }, // Пик: 30 → 50 пользователей
    { duration: "1m", target: 0 }, // Завершение: 50 → 0 пользователей
  ],

  // Дополнительные настройки
  noConnectionReuse: false,
  userAgent: "k6-load-test/1.0",
}

const BASE = __ENV.BASE_URL || "http://traefik:80"

export default function () {
  // Главная страница
  const res = http.get(`${BASE}/`, {
    tags: { type: "home" },
  })

  const success = check(res, {
    "status 200": (r) => r.status === 200,
  })

  errorRate.add(!success)
  latency.add(res.timings.duration)

  // Health check
  const h = http.get(`${BASE}/health`, {
    tags: { type: "health" },
  })

  const healthOk = check(h, {
    "health ok": (r) => r.status === 200 && r.body.includes('"status"'),
  })

  errorRate.add(!healthOk)

  sleep(1)
}

// Функция для отчёта в конце теста
export function handleSummary(data) {
  console.log("\n=== ИТОГОВЫЙ ОТЧЁТ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ ===\n")

  const httpReqs = data.metrics.http_reqs.values.count
  const httpFailed = data.metrics.http_req_failed.values.rate
  const duration = data.metrics.http_req_duration.values

  console.log("Общая статистика:")
  console.log(`  Всего запросов: ${httpReqs}`)
  console.log(`  Error Rate: ${(httpFailed * 100).toFixed(3)}%`)
  console.log("")

  console.log("Latency (время ответа):")
  console.log(`  Среднее: ${duration.avg.toFixed(2)}ms`)
  console.log(`  Медиана (p50): ${duration.med.toFixed(2)}ms`)
  console.log(`  p90: ${duration["p(90)"].toFixed(2)}ms`)
  console.log(`  p95: ${duration["p(95)"].toFixed(2)}ms`)
  console.log(`  p99: ${duration["p(99)"].toFixed(2)}ms`)
  console.log(`  Максимум: ${duration.max.toFixed(2)}ms`)
  console.log("")

  console.log("Проверка SLO:")
  const p95 = duration["p(95)"]
  const errRate = httpFailed

  console.log(`  p95 ≤ 200ms: ${p95.toFixed(2)}ms ${p95 <= 200 ? "✓ PASS" : "✗ FAIL"}`)
  console.log(`  Error Rate ≤ 0.1%: ${(errRate * 100).toFixed(3)}% ${errRate <= 0.001 ? "✓ PASS" : "✗ FAIL"}`)
  console.log("")

  return {
    stdout: JSON.stringify(data, null, 2),
  }
}
