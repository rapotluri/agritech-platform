"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useClaim, useUpdateClaimStatus } from "@/lib/hooks"
import type { ClaimStatus } from "@/lib/database.types"
import { ClaimResultSummary } from "./ClaimResultSummary"

interface ClaimDetailDialogProps {
  claimId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClaimDetailDialog({
  claimId,
  open,
  onOpenChange,
}: ClaimDetailDialogProps) {
  const { data: claim, isLoading } = useClaim(claimId || "")
  const updateStatus = useUpdateClaimStatus()

  if (!claimId) return null

  const setStatus = async (status: ClaimStatus) => {
    await updateStatus.mutateAsync({ id: claimId, status })
  }

  const meta = claim?.termsheet_snapshot?.meta || {}
  const weather =
    claim?.peril_breakdown?.weather_snapshot ||
    claim?.termsheet_snapshot?.weather_snapshot

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim details</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-gray-500">Loading…</p>}

        {claim && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="capitalize">
                {claim.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Type:{" "}
                {meta.source === "manual"
                  ? "Manual check"
                  : meta.source === "product"
                    ? "Product"
                    : meta.source === "enrollment"
                      ? "Policy"
                      : "—"}
              </span>
              {(claim as any).enrollment?.farmer?.english_name && (
                <span className="text-sm text-gray-500">
                  Farmer: {(claim as any).enrollment.farmer.english_name}
                </span>
              )}
              {(claim as any).enrollment?.product?.name && (
                <span className="text-sm text-gray-500">
                  Product: {(claim as any).enrollment.product.name}
                </span>
              )}
            </div>

            <ClaimResultSummary
              result={{
                triggered: Number(claim.payout) > 0,
                payout: Number(claim.payout),
                trigger_window: claim.trigger_window,
                trigger_value: claim.trigger_value,
                peril_breakdown: claim.peril_breakdown,
                weather_snapshot: weather,
                data_available_through: claim.peril_breakdown?.data_available_through,
                location: meta.location,
              }}
            />

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {claim.status === "pending" && (
                <>
                  <Button
                    onClick={() => setStatus("approved")}
                    disabled={updateStatus.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStatus("rejected")}
                    disabled={updateStatus.isPending}
                  >
                    Reject
                  </Button>
                </>
              )}
              {claim.status === "approved" && (
                <Button
                  onClick={() => setStatus("paid")}
                  disabled={updateStatus.isPending}
                >
                  Mark paid
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
