"use client"

import { useMemo, useState } from "react"
import {
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClaims, useUpdateClaimStatus } from "@/lib/hooks"
import type { ClaimStatus } from "@/lib/database.types"
import { ClaimEvaluatePanel } from "./ClaimEvaluatePanel"
import { ClaimDetailDialog } from "./ClaimDetailDialog"

function statusBadge(status: ClaimStatus) {
  const map: Record<ClaimStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }
  return (
    <Badge className={map[status]} variant="secondary">
      {status}
    </Badge>
  )
}

function formatMoney(n: number | null | undefined) {
  return `$${(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function exportClaimsCsv(rows: any[]) {
  const headers = [
    "id",
    "status",
    "payout",
    "trigger_window",
    "trigger_value",
    "source",
    "created_at",
  ]
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.status,
        r.payout,
        JSON.stringify(r.trigger_window || ""),
        r.trigger_value ?? "",
        r.termsheet_snapshot?.meta?.source || "",
        r.created_at,
      ].join(",")
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ClaimsManagement() {
  const [tab, setTab] = useState("list")
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: claims = [], isLoading, refetch } = useClaims(
    statusFilter === "all" ? undefined : statusFilter
  )
  const updateStatus = useUpdateClaimStatus()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return claims
    return claims.filter((c: any) => {
      const farmer = c.enrollment?.farmer?.english_name || ""
      const product = c.enrollment?.product?.name || ""
      const source = c.termsheet_snapshot?.meta?.source || ""
      return (
        c.id?.toLowerCase().includes(q) ||
        farmer.toLowerCase().includes(q) ||
        product.toLowerCase().includes(q) ||
        source.toLowerCase().includes(q) ||
        (c.trigger_window || "").toLowerCase().includes(q)
      )
    })
  }, [claims, search])

  const pendingIds = filtered
    .filter((c: any) => c.status === "pending")
    .map((c: any) => c.id)

  const bulkApprove = async () => {
    for (const id of pendingIds) {
      await updateStatus.mutateAsync({ id, status: "approved" })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-600 mt-2">
            Check coverage outcomes and review claims for approval
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportClaimsCsv(filtered)}
            disabled={!filtered.length}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={bulkApprove}
            disabled={!pendingIds.length || updateStatus.isPending}
          >
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            Bulk Approve
          </Button>
          <Button onClick={() => setTab("evaluate")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New check
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">Claims List</TabsTrigger>
          <TabsTrigger value="evaluate">Check coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search by farmer, product, or coverage window…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ClaimStatus | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                      <TableHead>Type</TableHead>
                  <TableHead>Farmer / Product</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                      Loading claims…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                      No claims yet. Use “Check coverage” to see if a payout applies, then save the result here.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((claim: any) => {
                  const source = claim.termsheet_snapshot?.meta?.source || "—"
                  const farmer = claim.enrollment?.farmer?.english_name
                  const product = claim.enrollment?.product?.name
                  return (
                    <TableRow key={claim.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {claim.created_at
                          ? new Date(claim.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {source === "manual"
                          ? "Manual check"
                          : source === "product"
                            ? "Product"
                            : source === "enrollment"
                              ? "Policy"
                              : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium text-gray-900">
                          {farmer || (source === "manual" ? "Manual check" : "Product check")}
                        </div>
                        <div className="text-gray-500">{product || "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate">
                        {claim.trigger_window || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(claim.payout)}
                      </TableCell>
                      <TableCell>{statusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedId(claim.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="evaluate" className="mt-6" forceMount>
          <div className={tab === "evaluate" ? "block" : "hidden"}>
            <ClaimEvaluatePanel
              onSaved={() => {
                refetch()
                setTab("list")
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ClaimDetailDialog
        claimId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </div>
  )
}
