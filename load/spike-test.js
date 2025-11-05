import http from "k6/http"
import { check, sleep } from "k6"
import { __ENV } from "k6/env"

// Spike-тест: резкий скачок нагрузки
export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "1m", target: 500 }, // Резкий скачок
    { duration: "3m", target: 500 },
    { duration: "10s", target: 10 },
    { duration: "3m", target: 0 },
  ],
}

const BASE = __ENV.BASE_URL || "http://traefik:80"

export default function () {
  const res = http.get(`${BASE}/`)
  check(res, { "status is 200": (r) => r.status === 200 })
  sleep(1)
}
