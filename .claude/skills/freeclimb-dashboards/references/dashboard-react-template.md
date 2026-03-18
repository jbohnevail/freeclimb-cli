# React Dashboard Template

A FreeClimb monitoring dashboard built with React, Shadcn UI, and Tailwind CSS.

## Dashboard Component

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface CallData {
    callId: string
    from: string
    to: string
    status: string
    direction: string
    dateCreated: string
    duration?: number
}

interface QueueData {
    queueId: string
    alias: string
    currentSize: number
    maxSize: number
}

interface DashboardData {
    activeCalls: CallData[]
    recentCalls: CallData[]
    queues: QueueData[]
    errors: Array<{ message: string; timestamp: string }>
    lastUpdated: string
}

const POLL_INTERVAL = 15_000 // 15 seconds
const FC_ACCOUNT_ID = process.env.NEXT_PUBLIC_FC_ACCOUNT_ID!
const FC_API_KEY = process.env.FC_API_KEY! // Server-side only

async function fetchFreeclimb(path: string, fields?: string[]): Promise<unknown> {
    const params = new URLSearchParams()
    if (fields) params.set("fields", fields.join(","))

    const url = `https://www.freeclimb.com/apiserver/Accounts/${FC_ACCOUNT_ID}${path}?${params}`
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${FC_ACCOUNT_ID}:${FC_API_KEY}`).toString("base64")}`,
        },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
}

export function FreeclimbDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard")
            if (!res.ok) throw new Error("Failed to fetch")
            setData(await res.json())
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        }
    }, [])

    useEffect(() => {
        refresh()
        const interval = setInterval(refresh, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [refresh])

    if (!data) return <div className="p-8 text-muted-foreground">Loading...</div>

    const completedCalls = data.recentCalls.filter((c) => c.status === "completed")
    const failedCalls = data.recentCalls.filter((c) => c.status === "failed")
    const successRate =
        data.recentCalls.length > 0
            ? ((completedCalls.length / data.recentCalls.length) * 100).toFixed(1)
            : "—"
    const avgDuration =
        completedCalls.length > 0
            ? (
                  completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) /
                  completedCalls.length
              ).toFixed(0)
            : "—"
    const totalQueueDepth = data.queues.reduce((sum, q) => sum + q.currentSize, 0)

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">FreeClimb Dashboard</h1>
                <span className="text-sm text-muted-foreground">
                    Updated {new Date(data.lastUpdated).toLocaleTimeString()}
                </span>
            </div>

            {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data.activeCalls.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{successRate}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{avgDuration}s</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalQueueDepth}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Calls Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Calls</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.activeCalls.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active calls</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Call ID</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Direction</TableHead>
                                    <TableHead>Started</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.activeCalls.map((call) => (
                                    <TableRow key={call.callId}>
                                        <TableCell className="font-mono text-xs">
                                            {call.callId}
                                        </TableCell>
                                        <TableCell>{call.from}</TableCell>
                                        <TableCell>{call.to}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    call.direction === "inbound"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {call.direction}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(call.dateCreated).toLocaleTimeString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Queues */}
            <Card>
                <CardHeader>
                    <CardTitle>Queue Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.queues.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No queues configured</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Queue</TableHead>
                                    <TableHead>Waiting</TableHead>
                                    <TableHead>Capacity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.queues.map((queue) => (
                                    <TableRow key={queue.queueId}>
                                        <TableCell>{queue.alias || queue.queueId}</TableCell>
                                        <TableCell className="font-bold">
                                            {queue.currentSize}
                                        </TableCell>
                                        <TableCell>{queue.maxSize}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Recent Errors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Recent Errors
                        {failedCalls.length > 0 && (
                            <Badge variant="destructive">{failedCalls.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.errors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent errors</p>
                    ) : (
                        <div className="space-y-2">
                            {data.errors.slice(0, 10).map((err, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2 rounded border p-2 text-sm"
                                >
                                    <Badge variant="destructive" className="mt-0.5 shrink-0">
                                        ERROR
                                    </Badge>
                                    <div>
                                        <p>{err.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(err.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
```

## API Route (Next.js)

### `app/api/dashboard/route.ts`

```typescript
import { NextResponse } from "next/server"

const FC_ACCOUNT_ID = process.env.FREECLIMB_ACCOUNT_ID!
const FC_API_KEY = process.env.FREECLIMB_API_KEY!
const FC_BASE = `https://www.freeclimb.com/apiserver/Accounts/${FC_ACCOUNT_ID}`

async function fc(path: string): Promise<unknown> {
    const res = await fetch(`${FC_BASE}${path}`, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${FC_ACCOUNT_ID}:${FC_API_KEY}`).toString("base64")}`,
        },
        next: { revalidate: 10 },
    })
    if (!res.ok) throw new Error(`FreeClimb API ${res.status}`)
    return res.json()
}

export async function GET() {
    try {
        const [activeCalls, recentCalls, queues, logs] = await Promise.all([
            fc("/Calls?status=inProgress") as Promise<{ calls: unknown[] }>,
            fc("/Calls") as Promise<{ calls: unknown[] }>,
            fc("/Queues") as Promise<{ queues: unknown[] }>,
            fc("/Logs") as Promise<{ logs: unknown[] }>,
        ])

        return NextResponse.json({
            activeCalls: activeCalls.calls || [],
            recentCalls: recentCalls.calls || [],
            queues: queues.queues || [],
            errors: (logs.logs || []).filter((l: any) => l.level === "ERROR").slice(0, 20),
            lastUpdated: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
        )
    }
}
```

## CLI-Based Dashboard (bash + watch)

For quick monitoring without a web app:

```bash
# Watch active calls (refreshes every 10s)
watch -n 10 'freeclimb calls:list --status inProgress --fields callId,from,to --json | jq ".data | length" | xargs echo "Active calls:"'

# One-liner dashboard
echo "=== FreeClimb Status ===" && \
echo -n "Active calls: " && freeclimb calls:list --status inProgress --fields callId --json | jq '.data | length' && \
echo -n "Queue depth: " && freeclimb call-queues:list --fields currentSize --json | jq '[.data[].currentSize] | add // 0' && \
echo -n "Recent errors: " && freeclimb logs:filter --pql 'level = "ERROR"' --maxItems 5 --json | jq '.data | length'
```
