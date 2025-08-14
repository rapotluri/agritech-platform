"use client"

import React, { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FarmerForm } from "./FarmerForm"

interface FarmerDialogProps {
  farmer?: any // For edit mode
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FarmerDialog({ 
  farmer, 
  trigger, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: FarmerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

  const isEditMode = !!farmer

  const defaultTrigger = (
    <Button className="bg-green-600 hover:bg-green-700 text-white">
      <PlusIcon className="h-5 w-5 mr-2" />
      Add Farmer
    </Button>
  )

  const handleSuccess = () => {
    onOpenChange?.(false)
    // Here you would typically refresh the farmers list
    // For now, we'll just close the dialog
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Farmer: ${farmer?.englishName}` : "Add New Farmer"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update farmer information and manage their plots."
              : "Enter farmer details and add their plots. All required fields are marked with *."}
          </DialogDescription>
        </DialogHeader>
        
        <FarmerForm 
          farmer={farmer}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
