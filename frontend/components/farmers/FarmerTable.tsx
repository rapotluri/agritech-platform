"use client"

import * as React from "react"
import { ArrowUpDown, MoreHorizontal, Copy, Eye, Edit, Trash2 } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface Farmer {
  id: string
  englishName: string
  sex: "male" | "female" | "other"
  phone: string
  nationalId: string
  dob: Date
  enrolmentDate: Date
  province: string
  district: string
  commune: string
  village: string
  kycStatus: "pending" | "verified" | "rejected"
  bankAccountUsd?: string
  bankAccountKhr?: string
  plotsCount: number
  assignedProduct?: string
}

interface FarmerTableProps {
  farmers: Farmer[]
  selectedFarmers: string[]
  onSelectionChange: (farmerIds: string[]) => void
  onSort: (column: keyof Farmer, direction: "asc" | "desc") => void
  sortColumn: keyof Farmer | null
  sortDirection: "asc" | "desc"
  className?: string
}

const getKYCStatusColor = (status: string) => {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getKYCStatusLabel = (status: string) => {
  switch (status) {
    case "verified":
      return "Verified"
    case "pending":
      return "Pending"
    case "rejected":
      return "Rejected"
    default:
      return "Unknown"
  }
}

const formatPhoneNumber = (phone: string) => {
  // Format: +855 12 345 678
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 9) {
    return `+855 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
  } catch (err) {
    console.error("Failed to copy text: ", err)
  }
}

export function FarmerTable({
  farmers,
  selectedFarmers,
  onSelectionChange,
  onSort,
  sortColumn,
  sortDirection,
  className,
}: FarmerTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(farmers.map(f => f.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectFarmer = (farmerId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFarmers, farmerId])
    } else {
      onSelectionChange(selectedFarmers.filter(id => id !== farmerId))
    }
  }

  const handleSort = (column: keyof Farmer) => {
    const direction = sortColumn === column && sortDirection === "asc" ? "desc" : "asc"
    onSort(column, direction)
  }

  const SortableHeader = ({ column, children }: { column: keyof Farmer; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <TooltipProvider>
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedFarmers.length === farmers.length && farmers.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all farmers"
                />
              </TableHead>
              <TableHead>
                <SortableHeader column="id">Farmer ID</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="englishName">Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="phone">Contact</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="province">Location</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="enrolmentDate">Enrollment Date</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="kycStatus">KYC Status</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="plotsCount">Plots Count</SortableHeader>
              </TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {farmers.map((farmer) => (
              <TableRow key={farmer.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedFarmers.includes(farmer.id)}
                    onCheckedChange={(checked) => handleSelectFarmer(farmer.id, checked as boolean)}
                    aria-label={`Select ${farmer.englishName}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {farmer.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {farmer.englishName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{farmer.englishName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {farmer.nationalId}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatPhoneNumber(farmer.phone)}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(farmer.phone)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy phone number</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{farmer.province}</div>
                    <div className="text-muted-foreground">{farmer.district}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {format(farmer.enrolmentDate, "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(farmer.enrolmentDate, { addSuffix: true })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn("border", getKYCStatusColor(farmer.kycStatus))}
                  >
                    {getKYCStatusLabel(farmer.kycStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium">{farmer.plotsCount}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {farmer.plotsCount} plot{farmer.plotsCount !== 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/protected/operations-dashboard/farmers/${farmer.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
