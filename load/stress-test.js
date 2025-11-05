import http from "k6/http"
import { check, sleep } from "k6"
import { __ENV } from "k6/env"

// Стресс-тест: постепенное увеличение нагрузки до предела
export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "5m", target: 200 },
    { duration: "2m", target: 300 },
    { duration: "5m", target: 300 },
    { duration: "10m", target: 0 },
  ],
}

const BASE = __ENV.BASE_URL || "http://traefik:80"

export default function () {
  const res = http.get(`${BASE}/`)
  check(res, { "status is 200": (r) => r.status === 200 })
  sleep(1)
}
