import { NextResponse } from "next/server"

const startTime = Date.now()

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000)

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    environment: process.env.NODE_ENV,
    canary: process.env.CANARY === "true",
  }

  return NextResponse.json(health)
}
